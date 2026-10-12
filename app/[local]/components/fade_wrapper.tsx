"use client";

import { useEffect, useRef, useState } from "react";

export default function FadeInObserver({ children }: { children: React.ReactNode }) {
	const [isVisible, setIsVisible] = useState(false);
	const elementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					// // Stop observing once it animates in (optional)
					if (elementRef.current) {
						observer.unobserve(elementRef.current);
					}
				}
			},
			{
				threshold: 0.15, // Triggers when 15% of the element is visible
			}
		);

		if (elementRef.current) {
			observer.observe(elementRef.current);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<div 
			ref={elementRef} 
			className={isVisible ? "fade-in w-full flex-center flex-col " : "opacity-0"}
		>
			{children}
		</div>
	);
}