import { useQuery } from "@tanstack/react-query";
import { BusFrontIcon, FootprintsIcon, TrainFrontIcon } from "lucide-react";
import { useState } from "react";
import type {
    EstateNearbyTransportQuery,
    EstateTransportPoi,
    EstateTransportPoiCategory,
    EstateTransportType,
    EstateWalkRoute,
    EstateWalkRouteSearchOption,
    EstateWalkTimeToTransportQuery
} from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Badge } from "@nmm/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Separator } from "@nmm/ui/components/separator";
import { Skeleton } from "@nmm/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { ToggleGroup, ToggleGroupItem } from "@nmm/ui/components/toggle-group";
import {
    estateNearbyTransportByTransactionQueryOptions,
    estateWalkTimeToTransportByTransactionQueryOptions
} from "@/features/estate/api/estate-queries";

type EstateTransactionAccessibilityCardProps = {
    transactionId: number;
};

type TransportTypeOption = {
    value: EstateTransportType;
    label: string;
};

const DEFAULT_TRANSPORT_TYPE: EstateTransportType = "subway";
const DEFAULT_RADIUS_KM = 1;
const DEFAULT_NEARBY_TRANSPORT_LIMIT = 5;
const DEFAULT_WALK_CANDIDATE_COUNT = 3;
const DEFAULT_WALK_SEARCH_OPTION: EstateWalkRouteSearchOption = "recommended";

const TRANSPORT_TYPE_OPTIONS: TransportTypeOption[] = [
    { value: "subway", label: "지하철" },
    { value: "bus_stop", label: "버스정류장" },
    { value: "all", label: "전체" }
];

export function EstateTransactionAccessibilityCard({ transactionId }: EstateTransactionAccessibilityCardProps) {
    const [transportType, setTransportType] = useState<EstateTransportType>(DEFAULT_TRANSPORT_TYPE);
    const nearbyTransportQuery = createNearbyTransportQuery(transportType);
    const walkTimeToTransportQuery = createWalkTimeToTransportQuery(transportType);
    const nearbyTransportResult = useQuery(
        estateNearbyTransportByTransactionQueryOptions(transactionId, nearbyTransportQuery)
    );
    const walkTimeToTransportResult = useQuery(
        estateWalkTimeToTransportByTransactionQueryOptions(transactionId, walkTimeToTransportQuery)
    );
    const isLoading = nearbyTransportResult.isLoading || walkTimeToTransportResult.isLoading;
    const error = nearbyTransportResult.error ?? walkTimeToTransportResult.error;

    function handleTransportTypeChange(value: string) {
        if (isEstateTransportType(value)) {
            setTransportType(value);
        }
    }

    return (
        <Card>
            <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="flex items-center gap-2">
                            <FootprintsIcon />
                            교통 접근성
                        </CardTitle>
                        <CardDescription>{formatRadiusDescription(DEFAULT_RADIUS_KM)}</CardDescription>
                    </div>
                    <ToggleGroup
                        type="single"
                        value={transportType}
                        onValueChange={handleTransportTypeChange}
                        variant="outline"
                        size="sm"
                        aria-label="교통수단 선택"
                    >
                        {TRANSPORT_TYPE_OPTIONS.map((option) => (
                            <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                {isLoading ? <EstateAccessibilityLoading /> : null}
                {!isLoading && error ? <EstateAccessibilityError error={error} /> : null}
                {!isLoading && !error && walkTimeToTransportResult.data ? (
                    <EstateBestWalkRoute route={walkTimeToTransportResult.data.best} />
                ) : null}
                {!isLoading && !error && nearbyTransportResult.data ? (
                    <EstateNearbyTransportList transportPois={nearbyTransportResult.data.transportPois} />
                ) : null}
                {!isLoading && !error && walkTimeToTransportResult.data ? (
                    <EstateWalkRouteCandidateList candidates={walkTimeToTransportResult.data.candidates} />
                ) : null}
                {!isLoading && !error && walkTimeToTransportResult.data ? (
                    <p className="text-xs text-muted-foreground">{walkTimeToTransportResult.data.notice}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function EstateAccessibilityLoading() {
    return (
        <div className="flex flex-col gap-4" aria-label="교통 접근성 불러오는 중">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-36 w-full" />
        </div>
    );
}

function EstateAccessibilityError({ error }: { error: Error }) {
    return (
        <Alert variant="destructive">
            <AlertTitle>교통 정보를 불러오지 못했습니다.</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
}

function EstateBestWalkRoute({ route }: { route: EstateWalkRoute | null }) {
    if (!route) {
        return (
            <Alert>
                <AlertTitle>도보 경로가 없습니다.</AlertTitle>
                <AlertDescription>반경 안에서 계산 가능한 도보 경로를 찾지 못했습니다.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">가장 가까운 도보 경로</span>
                <strong className="text-xl font-semibold">{route.destination.name}</strong>
                <span className="text-sm text-muted-foreground">{formatRouteDistance(route.totalDistanceM)}</span>
            </div>
            <div className="flex items-baseline gap-1 tabular-nums">
                <strong className="text-3xl font-semibold">{route.totalTimeMin}</strong>
                <span className="text-sm text-muted-foreground">분</span>
            </div>
        </div>
    );
}

function EstateNearbyTransportList({ transportPois }: { transportPois: EstateTransportPoi[] }) {
    if (transportPois.length === 0) {
        return (
            <Alert>
                <AlertTitle>주변 교통 정보가 없습니다.</AlertTitle>
                <AlertDescription>현재 반경 안에서 지하철역 또는 버스정류장을 찾지 못했습니다.</AlertDescription>
            </Alert>
        );
    }

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">주변 교통</h2>
                <Badge variant="secondary">{transportPois.length}개</Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>이름</TableHead>
                        <TableHead className="w-24">종류</TableHead>
                        <TableHead className="w-28 text-right">직선거리</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transportPois.map((transportPoi) => (
                        <TableRow key={createTransportPoiKey(transportPoi)}>
                            <TableCell>{transportPoi.name}</TableCell>
                            <TableCell>{formatTransportPoiCategory(transportPoi.category)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatOptionalDistance(transportPoi.straightDistanceM)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}

function EstateWalkRouteCandidateList({ candidates }: { candidates: EstateWalkRoute[] }) {
    if (candidates.length === 0) {
        return null;
    }

    return (
        <section className="flex flex-col gap-3">
            <Separator />
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">도보 후보</h2>
                <Badge variant="secondary">{candidates.length}개</Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>도착지</TableHead>
                        <TableHead className="w-24 text-right">시간</TableHead>
                        <TableHead className="w-28 text-right">거리</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map((candidate) => (
                        <TableRow key={createWalkRouteKey(candidate)}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {getTransportCategoryIcon(candidate.destination.category)}
                                    <span>{candidate.destination.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{candidate.totalTimeMin}분</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatRouteDistance(candidate.totalDistanceM)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}

function createNearbyTransportQuery(transportType: EstateTransportType): EstateNearbyTransportQuery {
    return {
        transportType,
        radiusKm: DEFAULT_RADIUS_KM,
        limit: DEFAULT_NEARBY_TRANSPORT_LIMIT
    };
}

function createWalkTimeToTransportQuery(transportType: EstateTransportType): EstateWalkTimeToTransportQuery {
    return {
        transportType,
        radiusKm: DEFAULT_RADIUS_KM,
        maxCandidates: DEFAULT_WALK_CANDIDATE_COUNT,
        searchOption: DEFAULT_WALK_SEARCH_OPTION
    };
}

function isEstateTransportType(value: string): value is EstateTransportType {
    return value === "subway" || value === "bus_stop" || value === "all";
}

function createTransportPoiKey(transportPoi: EstateTransportPoi) {
    return transportPoi.id ?? `${transportPoi.name}:${transportPoi.latitude}:${transportPoi.longitude}`;
}

function createWalkRouteKey(route: EstateWalkRoute) {
    return `${route.destination.name}:${route.destination.latitude}:${route.destination.longitude}:${route.searchOption}`;
}

function getTransportCategoryIcon(category: EstateTransportPoiCategory) {
    if (category === "bus_stop") {
        return <BusFrontIcon aria-hidden="true" />;
    }

    return <TrainFrontIcon aria-hidden="true" />;
}

function formatRadiusDescription(radiusKm: number) {
    return `반경 ${radiusKm}km 기준`;
}

function formatTransportPoiCategory(category: EstateTransportPoiCategory) {
    if (category === "subway") {
        return "지하철";
    }

    if (category === "bus_stop") {
        return "버스";
    }

    return "기타";
}

function formatOptionalDistance(distanceM: number | undefined) {
    return distanceM === undefined ? "-" : formatRouteDistance(distanceM);
}

function formatRouteDistance(distanceM: number) {
    if (distanceM >= 1000) {
        return `${(distanceM / 1000).toLocaleString("ko-KR", {
            maximumFractionDigits: 1
        })}km`;
    }

    return `${distanceM.toLocaleString("ko-KR")}m`;
}
