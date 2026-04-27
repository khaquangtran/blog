import {ReactNode} from "react";

export default function Figure({ children, caption }: { children: ReactNode; caption: string }) {
    return (
        <div>
            {caption}
            bbbbbb{children}
        </div>
    );
}