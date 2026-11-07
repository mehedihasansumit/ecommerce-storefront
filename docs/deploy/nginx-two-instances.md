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
