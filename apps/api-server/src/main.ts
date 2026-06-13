import { NestFactory } from "@nestjs/core";
import { Reflector } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { NativeLogger } from "nestjs-pino";
import { serverEnv } from "./infra/env";
import { ApiExceptionFilter, ApiResponseInterceptor } from "./infra/http";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

    app.useLogger(app.get(NativeLogger));
    app.enableCors({
        origin: serverEnv.app.webOrigin,
        credentials: true
    });

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor(app.get(Reflector)));

    await app.listen(serverEnv.app.port);
}

void bootstrap();
