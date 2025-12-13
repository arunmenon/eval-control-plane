import Fastify from "fastify";
import { registerRoutes } from "./routes";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await registerRoutes(app);

  return app;
}

if (require.main === module) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.PORT || 4000);
    await app.listen({ port, host: "0.0.0.0" });
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

