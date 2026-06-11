/// <reference types="vite/client" />

declare module "lucide-react/dist/esm/icons/*.mjs" {
    import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

    type LucideIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
        absoluteStrokeWidth?: boolean;
        size?: number | string;
    } & RefAttributes<SVGSVGElement>;

    const icon: ForwardRefExoticComponent<LucideIconProps>;
    export default icon;
}

interface ImportMetaEnv {
    readonly VITE_NMM_API_ORIGIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
