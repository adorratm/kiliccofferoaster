# Docker notları

Docker Desktop kapalıysa `docker compose` komutları çalışmaz. Yerel geliştirmede yalnızca PostgreSQL container’ı yeterlidir:

```bash
docker compose up -d postgres
```

Tam stack:

```bash
docker compose build
docker compose up -d
```

Dockerfile’lar: `docker/api.Dockerfile`, `docker/frontend.Dockerfile`, `docker/admin.Dockerfile`.

Yarn Berry `--immutable` için kökte `yarn.lock` gerekir (repoda mevcut).
