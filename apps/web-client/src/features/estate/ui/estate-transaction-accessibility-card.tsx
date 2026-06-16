import { useQuery } from "@tanstack/react-query";
import { BusFrontIcon, FootprintsIcon, MapPinIcon, TrainFrontIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@nmm/ui/components/empty";
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

type EstatePlannedStation = {
    key: string;
    name: string;
    straightDistanceM?: number;
    walkDistanceM?: number;
    walkTimeMin?: number;
};

type RouteMapCoordinate = {
    latitude: number;
    longitude: number;
};

type TransportViewText = {
    nearbyTitle: string;
    nearbyEmptyDescription: string;
    walkEmptyDescription: string;
};

type TmapLatLng = object;

type TmapMap = {
    fitBounds?: (bounds: TmapLatLngBounds) => void;
    on?: (eventName: string, handler: () => void) => void;
    panToBounds?: (bounds: TmapLatLngBounds) => void;
    setCenter?: (center: TmapLatLng) => void;
    zoomOut?: () => void;
};

type TmapLatLngBounds = {
    extend: (point: TmapLatLng) => void;
};

type TmapMapOverlay = {
    setMap: (map: TmapMap | null) => void;
};

type TmapSdk = {
    LatLng: new (latitude: number, longitude: number) => TmapLatLng;
    LatLngBounds?: new () => TmapLatLngBounds;
    Map: new (
        containerId: string,
        options: {
            center: TmapLatLng;
            width: string;
            height: string;
            zoom: number;
        }
    ) => TmapMap;
    Marker: new (options: { position: TmapLatLng; map: TmapMap; title: string }) => TmapMapOverlay;
    Polyline: new (options: {
        path: TmapLatLng[];
        strokeColor: string;
        strokeWeight: number;
        map: TmapMap;
    }) => TmapMapOverlay;
};

declare global {
    interface Window {
        Tmapv2?: TmapSdk;
        nmmTmapJsV2SdkPromise?: Promise<TmapSdk>;
        nmmTmapJsV2SdkAppKey?: string;
    }
}

const DEFAULT_TRANSPORT_TYPE: EstateTransportType = "subway";
const DEFAULT_RADIUS_KM = 1;
const DEFAULT_NEARBY_TRANSPORT_LIMIT = 5;
const DEFAULT_WALK_CANDIDATE_COUNT = 5;
const DEFAULT_WALK_SEARCH_OPTION: EstateWalkRouteSearchOption = "recommended";
const PLANNED_STATION_KEYWORDS = ["개통예정", "개통 예정", "예정역", "미개통", "공사중", "공사 중", "계획", "가칭"];
const TMAP_DEFAULT_ZOOM = 15;
const TMAP_LOAD_ERROR_MESSAGE = "TMAP JS V2 SDK 로드에 실패했습니다.";
const TMAP_SDK_SCRIPT_ID = "nmm-tmap-js-v2-sdk";
const TMAP_SDK_SCRIPT_SRC = "https://topopentile2.tmap.co.kr/scriptSDKV2/tmapjs2.min.js?version=20231206";
const TMAP_SDK_READY_TIMEOUT_MS = 5000;
const TMAP_SDK_READY_POLL_INTERVAL_MS = 50;

const TRANSPORT_TYPE_OPTIONS: TransportTypeOption[] = [
    { value: "subway", label: "지하철" },
    { value: "bus_stop", label: "버스정류장" },
    { value: "all", label: "전체" }
];

const TRANSPORT_VIEW_TEXT_BY_TYPE: Record<EstateTransportType, TransportViewText> = {
    subway: {
        nearbyTitle: "주변 지하철역",
        nearbyEmptyDescription: "현재 반경 안에서 지하철역을 찾지 못했습니다.",
        walkEmptyDescription: "반경 안에서 계산 가능한 지하철역 도보 경로를 찾지 못했습니다."
    },
    bus_stop: {
        nearbyTitle: "주변 버스정류장",
        nearbyEmptyDescription: "현재 반경 안에서 버스정류장을 찾지 못했습니다.",
        walkEmptyDescription: "반경 안에서 계산 가능한 버스정류장 도보 경로를 찾지 못했습니다."
    },
    all: {
        nearbyTitle: "주변 교통",
        nearbyEmptyDescription: "현재 반경 안에서 지하철역 또는 버스정류장을 찾지 못했습니다.",
        walkEmptyDescription: "반경 안에서 계산 가능한 도보 경로를 찾지 못했습니다."
    }
};

export function EstateTransactionAccessibilityCard({ transactionId }: EstateTransactionAccessibilityCardProps) {
    const [transportType, setTransportType] = useState<EstateTransportType>(DEFAULT_TRANSPORT_TYPE);
    const [selectedWalkRouteKey, setSelectedWalkRouteKey] = useState<string | null>(null);
    const nearbyTransportQuery = createNearbyTransportQuery(transportType);
    const walkTimeToTransportQuery = createWalkTimeToTransportQuery(transportType);
    const nearbyTransportResult = useQuery(
        estateNearbyTransportByTransactionQueryOptions(transactionId, nearbyTransportQuery)
    );
    const walkTimeToTransportResult = useQuery(
        estateWalkTimeToTransportByTransactionQueryOptions(transactionId, walkTimeToTransportQuery)
    );
    const transportPois = nearbyTransportResult.data?.transportPois ?? [];
    const walkRouteCandidates = walkTimeToTransportResult.data?.candidates ?? [];
    const plannedStations = createPlannedStations(transportPois, walkRouteCandidates);
    const visibleTransportPois = transportPois.filter((transportPoi) => !isPlannedStationPoi(transportPoi));
    const visibleWalkRouteCandidates = walkRouteCandidates.filter((route) => !isPlannedStationRoute(route));
    const bestWalkRoute = selectBestWalkRoute(walkTimeToTransportResult.data?.best ?? null, visibleWalkRouteCandidates);
    const selectedWalkRoute = selectSelectedWalkRoute(selectedWalkRouteKey, visibleWalkRouteCandidates, bestWalkRoute);
    const walkRouteByDestinationKey = createWalkRouteByDestinationKey(visibleWalkRouteCandidates);
    const transportViewText = getTransportViewText(transportType);
    const shouldShowPlannedStations = transportType !== "bus_stop";
    const isWalkRouteReady =
        !walkTimeToTransportResult.isLoading && !walkTimeToTransportResult.error && walkTimeToTransportResult.data;
    const isNearbyTransportReady =
        !nearbyTransportResult.isLoading && !nearbyTransportResult.error && nearbyTransportResult.data;

    useEffect(() => {
        const nextSelectedWalkRouteKey = selectedWalkRoute ? createWalkRouteKey(selectedWalkRoute) : null;

        if (selectedWalkRouteKey !== nextSelectedWalkRouteKey) {
            setSelectedWalkRouteKey(nextSelectedWalkRouteKey);
        }
    }, [selectedWalkRoute, selectedWalkRouteKey]);

    function handleTransportTypeChange(value: string) {
        if (isEstateTransportType(value)) {
            setTransportType(value);
        }
    }

    function handleWalkRouteSelect(route: EstateWalkRoute) {
        setSelectedWalkRouteKey(createWalkRouteKey(route));
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
                {walkTimeToTransportResult.isLoading ? <EstateWalkRouteLoading /> : null}
                {!walkTimeToTransportResult.isLoading && walkTimeToTransportResult.error ? (
                    <EstateAccessibilityError
                        title="도보 경로를 불러오지 못했습니다."
                        error={walkTimeToTransportResult.error}
                    />
                ) : null}
                {isWalkRouteReady ? (
                    <EstateSelectedWalkRoute
                        route={selectedWalkRoute}
                        bestRoute={bestWalkRoute}
                        viewText={transportViewText}
                    />
                ) : null}
                {nearbyTransportResult.isLoading ? <EstateNearbyTransportLoading /> : null}
                {!nearbyTransportResult.isLoading && nearbyTransportResult.error ? (
                    <EstateAccessibilityError
                        title="주변 교통 정보를 불러오지 못했습니다."
                        error={nearbyTransportResult.error}
                    />
                ) : null}
                {isNearbyTransportReady ? (
                    <EstateNearbyTransportList
                        transportPois={visibleTransportPois}
                        walkRouteByDestinationKey={walkRouteByDestinationKey}
                        selectedRouteKey={selectedWalkRouteKey}
                        viewText={transportViewText}
                        onRouteSelect={handleWalkRouteSelect}
                    />
                ) : null}
                {isWalkRouteReady ? (
                    <EstateWalkRouteCandidateList
                        candidates={visibleWalkRouteCandidates}
                        selectedRouteKey={selectedWalkRouteKey}
                        onRouteSelect={handleWalkRouteSelect}
                    />
                ) : null}
                {isNearbyTransportReady && shouldShowPlannedStations ? (
                    <EstatePlannedStationList plannedStations={plannedStations} />
                ) : null}
                {isWalkRouteReady ? (
                    <p className="text-xs text-muted-foreground">{walkTimeToTransportResult.data.notice}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function EstateWalkRouteLoading() {
    return (
        <div aria-label="도보 경로 불러오는 중">
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

function EstateNearbyTransportLoading() {
    return (
        <div aria-label="주변 교통 정보 불러오는 중">
            <Skeleton className="h-36 w-full" />
        </div>
    );
}

function EstateAccessibilityError({ title, error }: { title: string; error: Error }) {
    return (
        <Alert variant="destructive">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
}

function EstateSelectedWalkRoute({
    route,
    bestRoute,
    viewText
}: {
    route: EstateWalkRoute | null;
    bestRoute: EstateWalkRoute | null;
    viewText: TransportViewText;
}) {
    if (!route) {
        return (
            <Alert>
                <AlertTitle>도보 경로가 없습니다.</AlertTitle>
                <AlertDescription>{viewText.walkEmptyDescription}</AlertDescription>
            </Alert>
        );
    }

    const isBestRoute = bestRoute ? createWalkRouteKey(bestRoute) === createWalkRouteKey(route) : false;

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1fr)] lg:items-stretch">
            <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                        {isBestRoute ? "가장 가까운 도보 경로" : "선택한 도보 경로"}
                    </span>
                    <strong className="text-xl font-semibold">{route.destination.name}</strong>
                    <span className="text-sm text-muted-foreground">{formatRouteDistance(route.totalDistanceM)}</span>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                    <strong className="text-3xl font-semibold">{route.totalTimeMin}</strong>
                    <span className="text-sm text-muted-foreground">분</span>
                </div>
            </div>
            <EstateWalkRouteMap route={route} />
        </div>
    );
}

function EstateWalkRouteMap({ route }: { route: EstateWalkRoute }) {
    const mapId = useId();
    const mapElementId = `estate-walk-route-map-${mapId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<"ready" | "loading" | "missing-key" | "error">("loading");
    const tmapAppKey = import.meta.env.VITE_NMM_TMAP_APP_KEY;

    useEffect(() => {
        if (!tmapAppKey) {
            setStatus("missing-key");

            return undefined;
        }

        let isMounted = true;
        const mapOverlays: TmapMapOverlay[] = [];
        const routeCoordinates = createRouteMapCoordinates(route);
        const mapContainer = mapContainerRef.current;

        setStatus("loading");

        loadTmapSdk(tmapAppKey)
            .then((tmap) => {
                if (!isMounted || !mapContainer) {
                    return;
                }

                mapContainer.replaceChildren();
                const routePoints = routeCoordinates.map(
                    (coordinate) => new tmap.LatLng(coordinate.latitude, coordinate.longitude)
                );
                const centerPoint = routePoints[Math.floor(routePoints.length / 2)];
                const startPoint = routePoints[0];
                const endPoint = routePoints.at(-1);

                if (!centerPoint || !startPoint || !endPoint) {
                    setStatus("error");

                    return;
                }

                const routeStartPoint = startPoint;
                const routeEndPoint = endPoint;
                const map = new tmap.Map(mapElementId, {
                    center: centerPoint,
                    width: "100%",
                    height: "100%",
                    zoom: TMAP_DEFAULT_ZOOM
                });

                function drawRoute() {
                    if (!isMounted) {
                        return;
                    }

                    try {
                        mapOverlays.push(
                            new tmap.Marker({
                                position: routeStartPoint,
                                map,
                                title: route.origin.name
                            })
                        );
                        mapOverlays.push(
                            new tmap.Marker({
                                position: routeEndPoint,
                                map,
                                title: route.destination.name
                            })
                        );

                        if (routePoints.length > 1) {
                            mapOverlays.push(
                                new tmap.Polyline({
                                    path: routePoints,
                                    strokeColor: "#2563eb",
                                    strokeWeight: 5,
                                    map
                                })
                            );
                        }

                        fitTmapBounds(tmap, map, routePoints);
                        setStatus("ready");
                    } catch (error) {
                        console.error("Failed to draw TMAP walk route overlays.", error);
                        setStatus("error");
                    }
                }

                if (map.on) {
                    map.on("ConfigLoad", drawRoute);
                } else {
                    drawRoute();
                }
            })
            .catch((error: unknown) => {
                console.error("Failed to render TMAP walk route map.", error);

                if (isMounted) {
                    setStatus("error");
                }
            });

        return () => {
            isMounted = false;
            mapOverlays.forEach((overlay) => {
                overlay.setMap(null);
            });
            mapContainer?.replaceChildren();
        };
    }, [mapElementId, route, tmapAppKey]);

    return (
        <div className="relative min-h-64 overflow-hidden rounded-md border bg-muted">
            <div
                id={mapElementId}
                ref={mapContainerRef}
                className="h-64 w-full lg:h-full"
                aria-label={`${route.origin.name}에서 ${route.destination.name}까지 도보 경로 지도`}
            />
            {status !== "ready" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/90 p-4 text-center text-sm text-muted-foreground">
                    <div className="flex max-w-64 flex-col items-center gap-2">
                        <MapPinIcon aria-hidden="true" />
                        <span>{formatMapStatus(status)}</span>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function EstateNearbyTransportList({
    transportPois,
    walkRouteByDestinationKey,
    selectedRouteKey,
    onRouteSelect,
    viewText
}: {
    transportPois: EstateTransportPoi[];
    walkRouteByDestinationKey: Map<string, EstateWalkRoute>;
    selectedRouteKey: string | null;
    onRouteSelect: (route: EstateWalkRoute) => void;
    viewText: TransportViewText;
}) {
    if (transportPois.length === 0) {
        return (
            <Alert>
                <AlertTitle>주변 교통 정보가 없습니다.</AlertTitle>
                <AlertDescription>{viewText.nearbyEmptyDescription}</AlertDescription>
            </Alert>
        );
    }

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{viewText.nearbyTitle}</h2>
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
                    {transportPois.map((transportPoi) => {
                        const matchedRoute = walkRouteByDestinationKey.get(createTransportDestinationKey(transportPoi));
                        const matchedRouteKey = matchedRoute ? createWalkRouteKey(matchedRoute) : null;
                        const isSelected = selectedRouteKey !== null && selectedRouteKey === matchedRouteKey;

                        return (
                            <EstateNearbyTransportRow
                                key={createTransportPoiKey(transportPoi)}
                                transportPoi={transportPoi}
                                matchedRoute={matchedRoute}
                                isSelected={isSelected}
                                onRouteSelect={onRouteSelect}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </section>
    );
}

function EstateNearbyTransportRow({
    transportPoi,
    matchedRoute,
    isSelected,
    onRouteSelect
}: {
    transportPoi: EstateTransportPoi;
    matchedRoute: EstateWalkRoute | undefined;
    isSelected: boolean;
    onRouteSelect: (route: EstateWalkRoute) => void;
}) {
    function handleRouteSelect() {
        if (matchedRoute) {
            onRouteSelect(matchedRoute);
        }
    }

    return (
        <TableRow className={isSelected ? "bg-muted/50" : undefined}>
            <TableCell>
                {matchedRoute ? (
                    <Button type="button" variant="link" className="h-auto p-0 text-left" onClick={handleRouteSelect}>
                        {transportPoi.name}
                    </Button>
                ) : (
                    transportPoi.name
                )}
            </TableCell>
            <TableCell>{formatTransportPoiCategory(transportPoi.category)}</TableCell>
            <TableCell className="text-right tabular-nums">
                {formatOptionalDistance(transportPoi.straightDistanceM)}
            </TableCell>
        </TableRow>
    );
}

function EstatePlannedStationList({ plannedStations }: { plannedStations: EstatePlannedStation[] }) {
    return (
        <section className="flex flex-col gap-3">
            <Separator />
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">개통예정 역</h2>
                <Badge variant="secondary">{plannedStations.length}개</Badge>
            </div>
            {plannedStations.length === 0 ? (
                <Empty className="py-8 md:p-8">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <TrainFrontIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>확인된 개통예정 역이 없습니다.</EmptyTitle>
                    </EmptyHeader>
                </Empty>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>이름</TableHead>
                            <TableHead className="w-28 text-right">직선거리</TableHead>
                            <TableHead className="w-32 text-right">도보</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plannedStations.map((station) => (
                            <TableRow key={station.key}>
                                <TableCell>{station.name}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatOptionalDistance(station.straightDistanceM)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatOptionalWalkSummary(station.walkTimeMin, station.walkDistanceM)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </section>
    );
}

function EstateWalkRouteCandidateList({
    candidates,
    selectedRouteKey,
    onRouteSelect
}: {
    candidates: EstateWalkRoute[];
    selectedRouteKey: string | null;
    onRouteSelect: (route: EstateWalkRoute) => void;
}) {
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
                    {candidates.map((candidate) => {
                        const candidateKey = createWalkRouteKey(candidate);
                        const isSelected = selectedRouteKey === candidateKey;

                        return (
                            <EstateWalkRouteCandidateRow
                                key={candidateKey}
                                candidate={candidate}
                                isSelected={isSelected}
                                onRouteSelect={onRouteSelect}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </section>
    );
}

function EstateWalkRouteCandidateRow({
    candidate,
    isSelected,
    onRouteSelect
}: {
    candidate: EstateWalkRoute;
    isSelected: boolean;
    onRouteSelect: (route: EstateWalkRoute) => void;
}) {
    function handleRouteSelect() {
        onRouteSelect(candidate);
    }

    return (
        <TableRow className={isSelected ? "bg-muted/50" : undefined}>
            <TableCell>
                <Button type="button" variant="link" className="h-auto p-0 text-left" onClick={handleRouteSelect}>
                    <span className="flex items-center gap-2">
                        {getTransportCategoryIcon(candidate.destination.category)}
                        <span>{candidate.destination.name}</span>
                    </span>
                </Button>
            </TableCell>
            <TableCell className="text-right tabular-nums">{candidate.totalTimeMin}분</TableCell>
            <TableCell className="text-right tabular-nums">{formatRouteDistance(candidate.totalDistanceM)}</TableCell>
        </TableRow>
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

function getTransportViewText(transportType: EstateTransportType): TransportViewText {
    return TRANSPORT_VIEW_TEXT_BY_TYPE[transportType];
}

function selectBestWalkRoute(bestRoute: EstateWalkRoute | null, visibleCandidates: EstateWalkRoute[]) {
    if (!bestRoute || !isPlannedStationRoute(bestRoute)) {
        return bestRoute;
    }

    return visibleCandidates[0] ?? null;
}

function selectSelectedWalkRoute(
    selectedRouteKey: string | null,
    visibleCandidates: EstateWalkRoute[],
    bestRoute: EstateWalkRoute | null
) {
    if (selectedRouteKey) {
        const selectedRoute = visibleCandidates.find((candidate) => createWalkRouteKey(candidate) === selectedRouteKey);

        if (selectedRoute) {
            return selectedRoute;
        }
    }

    return bestRoute ?? visibleCandidates[0] ?? null;
}

function createWalkRouteByDestinationKey(walkRoutes: EstateWalkRoute[]) {
    return new Map(walkRoutes.map((walkRoute) => [createWalkRouteDestinationKey(walkRoute), walkRoute]));
}

function createPlannedStations(transportPois: EstateTransportPoi[], walkRouteCandidates: EstateWalkRoute[]) {
    const plannedStationMap = new Map<string, EstatePlannedStation>();

    for (const transportPoi of transportPois) {
        if (!isPlannedStationPoi(transportPoi)) {
            continue;
        }

        const key = createPlannedStationKey(transportPoi.name, transportPoi.latitude, transportPoi.longitude);
        plannedStationMap.set(key, {
            key,
            name: transportPoi.name,
            straightDistanceM: transportPoi.straightDistanceM
        });
    }

    for (const walkRoute of walkRouteCandidates) {
        if (!isPlannedStationRoute(walkRoute)) {
            continue;
        }

        const key = createPlannedStationKey(
            walkRoute.destination.name,
            walkRoute.destination.latitude,
            walkRoute.destination.longitude
        );
        const plannedStation = plannedStationMap.get(key);
        plannedStationMap.set(key, {
            key,
            name: walkRoute.destination.name,
            straightDistanceM: plannedStation?.straightDistanceM,
            walkDistanceM: walkRoute.totalDistanceM,
            walkTimeMin: walkRoute.totalTimeMin
        });
    }

    return [...plannedStationMap.values()];
}

function isPlannedStationPoi(transportPoi: EstateTransportPoi) {
    if (transportPoi.operationStatus === "planned") {
        return transportPoi.category !== "bus_stop";
    }

    return transportPoi.category === "subway" && isPlannedStationName(transportPoi.name);
}

function isPlannedStationRoute(route: EstateWalkRoute) {
    if (route.destination.operationStatus === "planned") {
        return route.destination.category !== "bus_stop";
    }

    return route.destination.category === "subway" && isPlannedStationName(route.destination.name);
}

function isPlannedStationName(name: string) {
    return PLANNED_STATION_KEYWORDS.some((keyword) => name.includes(keyword));
}

function createTransportPoiKey(transportPoi: EstateTransportPoi) {
    return transportPoi.id ?? `${transportPoi.name}:${transportPoi.latitude}:${transportPoi.longitude}`;
}

function createPlannedStationKey(name: string, latitude: number, longitude: number) {
    return `${name}:${latitude}:${longitude}`;
}

function createTransportDestinationKey(transportPoi: EstateTransportPoi) {
    return `${transportPoi.category}:${transportPoi.name}:${transportPoi.latitude}:${transportPoi.longitude}`;
}

function createWalkRouteDestinationKey(route: EstateWalkRoute) {
    return `${route.destination.category}:${route.destination.name}:${route.destination.latitude}:${route.destination.longitude}`;
}

function createWalkRouteKey(route: EstateWalkRoute) {
    return `${route.destination.name}:${route.destination.latitude}:${route.destination.longitude}:${route.searchOption}`;
}

function createRouteMapCoordinates(route: EstateWalkRoute): RouteMapCoordinate[] {
    if (route.routePath.length > 1) {
        return route.routePath;
    }

    return [
        {
            latitude: route.origin.latitude,
            longitude: route.origin.longitude
        },
        {
            latitude: route.destination.latitude,
            longitude: route.destination.longitude
        }
    ];
}

function loadTmapSdk(appKey: string) {
    if (isTmapSdkReady(window.Tmapv2)) {
        return Promise.resolve(window.Tmapv2);
    }

    if (window.nmmTmapJsV2SdkPromise && window.nmmTmapJsV2SdkAppKey === appKey) {
        return window.nmmTmapJsV2SdkPromise;
    }

    window.nmmTmapJsV2SdkAppKey = appKey;
    window.nmmTmapJsV2SdkPromise = new Promise<TmapSdk>((resolve, reject) => {
        const startedAt = Date.now();
        const scriptElement = getOrCreateTmapSdkScript();

        function resolveWhenReady() {
            if (isTmapSdkReady(window.Tmapv2)) {
                resolve(window.Tmapv2);
                return;
            }

            if (Date.now() - startedAt >= TMAP_SDK_READY_TIMEOUT_MS) {
                reject(new Error(TMAP_LOAD_ERROR_MESSAGE));
                return;
            }

            window.setTimeout(resolveWhenReady, TMAP_SDK_READY_POLL_INTERVAL_MS);
        }

        scriptElement.addEventListener("error", handleScriptError, { once: true });

        function handleScriptError() {
            reject(new Error(TMAP_LOAD_ERROR_MESSAGE));
        }

        resolveWhenReady();
    }).catch((error: unknown) => {
        window.nmmTmapJsV2SdkPromise = undefined;
        window.nmmTmapJsV2SdkAppKey = undefined;

        throw error;
    });

    return window.nmmTmapJsV2SdkPromise;
}

function getOrCreateTmapSdkScript() {
    const existingScript = document.getElementById(TMAP_SDK_SCRIPT_ID);

    if (existingScript instanceof HTMLScriptElement) {
        return existingScript;
    }

    const scriptElement = document.createElement("script");

    scriptElement.id = TMAP_SDK_SCRIPT_ID;
    scriptElement.src = TMAP_SDK_SCRIPT_SRC;
    document.head.append(scriptElement);

    return scriptElement;
}

function isTmapSdkReady(tmap: TmapSdk | undefined): tmap is TmapSdk {
    return (
        typeof tmap?.LatLng === "function" &&
        typeof tmap.Map === "function" &&
        typeof tmap.Marker === "function" &&
        typeof tmap.Polyline === "function"
    );
}

function fitTmapBounds(tmap: TmapSdk, map: TmapMap, routePoints: TmapLatLng[]) {
    if (tmap.LatLngBounds && map.fitBounds) {
        const bounds = new tmap.LatLngBounds();

        routePoints.forEach((routePoint) => {
            bounds.extend(routePoint);
        });
        map.fitBounds(bounds);

        return;
    }

    const centerPoint = routePoints[Math.floor(routePoints.length / 2)];

    if (centerPoint) {
        map.setCenter?.(centerPoint);
    }
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

function formatOptionalWalkSummary(walkTimeMin: number | undefined, walkDistanceM: number | undefined) {
    if (walkTimeMin === undefined) {
        return "-";
    }

    if (walkDistanceM === undefined) {
        return `${walkTimeMin}분`;
    }

    return `${walkTimeMin}분 / ${formatRouteDistance(walkDistanceM)}`;
}

function formatMapStatus(status: "ready" | "loading" | "missing-key" | "error") {
    if (status === "missing-key") {
        return "지도 키가 설정되지 않았습니다.";
    }

    if (status === "error") {
        return "지도를 불러오지 못했습니다.";
    }

    return "지도를 불러오는 중입니다.";
}

function formatRouteDistance(distanceM: number) {
    if (distanceM >= 1000) {
        return `${(distanceM / 1000).toLocaleString("ko-KR", {
            maximumFractionDigits: 1
        })}km`;
    }

    return `${distanceM.toLocaleString("ko-KR")}m`;
}
