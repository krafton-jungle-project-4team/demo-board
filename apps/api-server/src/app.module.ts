import { Module } from "@nestjs/common";
import { LoggerModule, nativeLoggerOptions } from "nestjs-pino";
import { DatabaseModule } from "./infra/database";
import { getRequestId } from "./infra/http";
import { AuthModule } from "./features/auth";
import { ExampleModule } from "./features/example";
import { HealthModule } from "./features/health";
import { PostModule } from "./features/post";
import { PostQueryModule } from "./features/post-query";
import { PostsModule } from "./features/posts";

@Module({
    imports: [
        LoggerModule.forRoot({
            assignResponse: true,
            pinoHttp: {
                ...nativeLoggerOptions,
                level: "debug",
                quietReqLogger: true,
                customAttributeKeys: {
                    reqId: "requestId"
                },
                genReqId: getRequestId
            }
        }),
        DatabaseModule,
        AuthModule,
        ExampleModule,
        PostQueryModule,
        HealthModule,
        PostModule,
        PostsModule
    ]
})
export class AppModule {}
