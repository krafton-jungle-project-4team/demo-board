import { Module } from "@nestjs/common";
import { LoggerModule, nativeLoggerOptions } from "nestjs-pino";
import { DatabaseModule } from "./infra/database";
import { getRequestId } from "./infra/http";
import { AuthModule } from "./features/auth";
import { BoardModule } from "./features/board";
import { HealthModule } from "./features/health";

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
        BoardModule,
        HealthModule
    ]
})
export class AppModule {}
