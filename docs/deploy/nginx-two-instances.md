# Nginx in front of two app instances

`docker-compose.prod.yml` runs the app twice (`ecommerce-app` on 5001,
`ecommerce-app2` on 5002) to use both CPU cores (ADR 0005). Nginx is configured
by hand on the VPS, so this file is the source for that config.

Add an upstream above the site's `server` blocks and point `proxy_pass` at it:

```nginx
upstream lourhaus_app {
    least_conn;                  # send each request to the less busy instance
    server 127.0.0.1:5001 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:5002 max_fails=3 fail_timeout=10s;
}

server {
    server_name www.lourhaus.com lourhaus.com;
    location / {
        proxy_pass http://lourhaus_app;
        proxy_next_upstream error timeout http_502 http_503;  # retry the other instance
        # ...existing proxy_set_header lines unchanged...
    }
}
```

Apply: `nginx -t && systemctl reload nginx`.

`proxy_next_upstream` also covers deploys: while one container restarts, GET
requests go to the other. (Nginx never retries POST, so a checkout in flight
during the restart can still fail once.)

## Real visitor IPs behind Cloudflare

The app rate-limits by IP (`src/shared/lib/rate-limit.ts`) and reads it from the
`X-Real-IP` header Nginx sets. Behind Cloudflare, Nginx's `$remote_addr` is a
Cloudflare edge, so every visitor would share one IP and one limit. Restore the
visitor IP inside the site's `server` block, trusting `CF-Connecting-IP` only
from Cloudflare's ranges (current list: https://www.cloudflare.com/ips):

```nginx
server {
    server_name www.lourhaus.com lourhaus.com;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    real_ip_header CF-Connecting-IP;
    # ...
}
```

Check: after `nginx -t && systemctl reload nginx`, `/var/log/nginx/access.log`
shows visitors' own IPs instead of 104.x / 162.158.x / 172.64-71.x addresses.
**Apply this before deploying the rate limiting**, or all visitors share a limit.

## Refuse bare RSC requests (before Cloudflare page caching)

Next answers a page URL with its RSC payload when the request carries `RSC: 1`.
Cloudflare ignores `Vary: rsc`, so if it cached such a response, every visitor
of that page would get raw RSC (`cloudflare-page-cache.md`). Next's router
always adds `?_rsc=`, so refuse the bare form. Next strips the header before the
app's proxy runs, which is why this check lives in Nginx:

```nginx
map "$http_rsc:$arg__rsc" $lourhaus_bare_rsc {
    default 0;
    "1:" 1;
}

server {
    # ...
    location / {
        if ($lourhaus_bare_rsc) { return 400; }
        # ...
    }
}
```

## Visit tracker (ADR 0006)

`POST /api/track` goes to the tracker container on 127.0.0.1:5003, with the app
instances as backup so the Next route answers if the tracker is down. Put the
upstream next to `lourhaus_app` and the location before `location /`:

```nginx
upstream lourhaus_tracker {
    server 127.0.0.1:5003 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:5001 backup;
    server 127.0.0.1:5002 backup;
}

server {
    # ...
    location = /api/track {
        client_max_body_size 32k;
        proxy_pass http://lourhaus_tracker;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # ...
}
```

Deploy first (so the tracker container is running), then apply this.

## Firewall

With host networking the app ports are reachable from the internet, skipping
Cloudflare and Nginx. Close them; do **not** set `HOSTNAME=127.0.0.1` instead
(ADR 0005):

```sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw deny 5001/tcp && ufw deny 5002/tcp
ufw enable
```

Check the VPS's other services (other apps' ports) before `ufw enable`.
