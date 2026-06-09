import { NestFactory } from "@nestjs/core";
import { ApiExceptionFilter, ApiResponseInterceptor } from "./common/http";
import { AppModule } from "./app.module";
import { mapDomainErrorToHttp } from "./app-http-error.mapper";
import { loadServerEnv } from "./env";

async function bootstrap() {
    loadServerEnv();

    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiExceptionFilter(mapDomainErrorToHttp));
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    app.enableCors({
        origin: process.env.NMM_WEB_ORIGIN ?? "http://localhost:5173",
        credentials: true
    });

    await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
