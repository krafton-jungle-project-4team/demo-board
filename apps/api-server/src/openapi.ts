import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { loadServerEnv } from "./env";
import { sessionCookieName } from "./features/auth";

async function emitOpenApiSpec() {
    loadServerEnv();
    process.env.NMM_DB_MANUAL_INITIALIZATION ??= "true";

    const app = await NestFactory.create(AppModule, {
        logger: false
    });

    app.setGlobalPrefix("api");

    const config = new DocumentBuilder()
        .setTitle("NMM API")
        .setDescription("나만의 무기 만들기 보일러플레이트용 게시판 API")
        .setVersion("0.1.0")
        .addCookieAuth(sessionCookieName, { type: "apiKey", in: "cookie" }, "sessionCookie")
        .addBearerAuth(
            {
                type: "http",
                scheme: "bearer",
                bearerFormat: "session"
            },
            "session"
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const outputPath = path.resolve(process.cwd(), "../../openapi/api-server.json");

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    await app.close();
}

void emitOpenApiSpec();
