# Docker notları

Yerel geliştirmede Docker Engine yeterlidir (Docker Desktop şart değil). Compose komutları daemon çalışıyorken geçerlidir. Yalnızca PostgreSQL container’ı yeterlidir:

```bash
docker compose up -d postgres
```

Tam stack:

```bash
docker compose build
docker compose up -d
```

Dockerfile’lar: `docker/api.Dockerfile`, `docker/frontend.Dockerfile`, `docker/admin.Dockerfile` (`node:26-bookworm-slim`). Production hedefi Linux’tur.

Yarn Berry `--immutable` için kökte `yarn.lock` gerekir (repoda mevcut).
