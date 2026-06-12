import { Module } from "@nestjs/common";
import { LoggerModule, nativeLoggerOptions } from "nestjs-pino";
import { DatabaseModule } from "./infra/database";
import { getRequestId } from "./infra/http";
import { ExampleModule } from "./features/example";
import { HealthModule } from "./features/health";
import { PostQueryModule } from "./features/post-query";

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
        ExampleModule,
        PostQueryModule,
        HealthModule
    ]
})
export class AppModule {}
