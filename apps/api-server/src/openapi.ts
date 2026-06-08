import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function emitOpenApiSpec() {
  const app = await NestFactory.create(AppModule, {
    logger: false
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("NMM API")
    .setDescription("나만의 무기 만들기 보일러플레이트용 더미 API")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outputPath = path.resolve(process.cwd(), "../../openapi/api-server.json");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await app.close();
}

void emitOpenApiSpec();
