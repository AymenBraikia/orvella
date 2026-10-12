export default function Info({ classnames = "w-6", clr = "currentColor", style }: { classnames?: string; clr?: string; style?: React.CSSProperties }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={classnames} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>
    );
}
