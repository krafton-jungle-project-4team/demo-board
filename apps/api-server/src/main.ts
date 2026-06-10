import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { serverEnv } from "./infra/env";
import { ApiExceptionFilter, ApiResponseInterceptor } from "./infra/http";
import { AppModule } from "./app.module";
import { BETTER_AUTH, type BetterAuth } from "./features/auth";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false
    });

    app.enableCors({
        origin: serverEnv.app.webOrigin,
        credentials: true
    });
    await mountBetterAuth(app.getHttpAdapter().getInstance(), app.get(BETTER_AUTH));
    app.useBodyParser("json");
    app.useBodyParser("urlencoded", { extended: true });

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    await app.listen(serverEnv.app.port);
}

async function mountBetterAuth(server: { all(path: string, handler: unknown): void }, auth: BetterAuth) {
    const { toNodeHandler } = await import("better-auth/node");

    server.all("/api/auth/{*authPath}", toNodeHandler(auth));
}

void bootstrap();
