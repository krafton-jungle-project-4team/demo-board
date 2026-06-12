import { DEFAULT_ACTIONS } from "vega-embed";
import * as vegaThemes from "vega-themes";
import type { EmbedOptions } from "vega-embed";

export type {
    Actions as VegaEmbedActions,
    EmbedOptions as VegaEmbedOptions,
    Hover as VegaEmbedHover,
    Result as VegaEmbedResult,
    VisualizationSpec as VegaVisualizationSpec
} from "vega-embed";
export type { Config as VegaConfig, Spec as VegaSpec } from "vega";
export type { Config as VegaLiteConfig, TopLevelSpec as VegaLiteSpec } from "vega-lite";

export const vegaOfficialDefaultActions = DEFAULT_ACTIONS;
export const vegaOfficialThemes = vegaThemes;

export type VegaOfficialTheme = NonNullable<EmbedOptions["theme"]>;
export type VegaOfficialThemeConfig = (typeof vegaThemes)[Exclude<keyof typeof vegaThemes, "version">];
