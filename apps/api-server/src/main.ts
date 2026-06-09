import { NestFactory } from "@nestjs/core";
import { serverEnv } from "./common/env";
import { ApiExceptionFilter, ApiResponseInterceptor } from "./common/http";
import { AppModule } from "./app.module";
import { mapDomainErrorToHttp } from "./app-http-error.mapper";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiExceptionFilter(mapDomainErrorToHttp));
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    app.enableCors({
        origin: serverEnv.app.webOrigin,
        credentials: true
    });

    await app.listen(serverEnv.app.port);
}

void bootstrap();
