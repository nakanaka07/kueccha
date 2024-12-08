// src/app.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef, CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import loadingImage from "./row1.png";


const App: React.FC = () => {
    const initialAreaVisibility = useMemo(() => {
        const initialVisibility: Record<AreaType, boolean> = {} as any;
        for (const areaName in AREAS) {
            initialVisibility[areaName as AreaType] = true;
        }
        return initialVisibility;
    }, []);


	const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);
	const { pois, isLoading } = useSheetData();
	const filteredPois = useMemo(
		() => pois.filter((poi) => areaVisibility[poi.area]),
		[pois, areaVisibility]
	);

	console.log("App component rendered. Filtered POIs:", filteredPois);  // filteredPois の内容を確認


	const handleCheckboxChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
			setAreaVisibility((prev) => ({ ...prev, [areaType]: e.target.checked }));
		},
		[]
	);

	const handleMarkerClick = useCallback((areaType: AreaType) => {
		setAreaVisibility((prev) => ({
			...prev,
			[areaType]: !prev[areaType],
		}));
	}, []);

    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);
    const checkboxAreaClassName = isCheckboxVisible
        ? "checkbox-area visible"
        : "checkbox-area hidden";

    const mapContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		if (!isLoading && mapContainerRef.current) {
			timer = setTimeout(() => {
				mapContainerRef.current!.style.opacity = "1";
			}, 500);
		}
		return () => clearTimeout(timer);
	}, [isLoading, mapContainerRef]);

	return (
		<div
			style={{
				width: "100%",
				height: "100vh",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div
				ref={mapContainerRef}
				style={{
					opacity: 0,
					transition: "opacity 0.5s ease-in-out",
					width: "100%",
					height: "100%",
					position: "relative",
				}}
			>
				<Map pois={filteredPois} />

				<button
					onClick={() => setIsCheckboxVisible((prev) => !prev)}
					style={{ position: "absolute", top: "90px", left: "10px", zIndex: 2 }}
				>
					{isCheckboxVisible
						? "チェックボックスを隠す"
						: "チェックボックスを表示"}
				</button>

				<div
					className={checkboxAreaClassName}
					style={{
						position: "absolute",
						top: "120px",
						left: "10px",
						zIndex: 1,
						backgroundColor: "white",
						padding: "10px",
					}}
				>
					{Object.entries(AREAS).map(([areaType, areaName]) => (
						<label
							key={areaType}
							htmlFor={`checkbox-${areaType}`}
							style={{
								display: "flex",
								alignItems: "center",
								cursor: "pointer",
								marginBottom: "5px",
							}}
						>
							<span
								style={{
									display: "inline-block",
									width: "16px",
									height: "16px",
									borderRadius: "50%",
									backgroundColor: filteredPois.some(
										(poi) => poi.area === areaType
									)
										? AREA_COLORS[areaType as AreaType] || defaultMarkerColor
										: "gray",
									marginRight: "5px",
									border: "1px solid white",
									opacity: areaVisibility[areaType as AreaType] ? 1 : 0.5,
									cursor: "pointer", // ポインターカーソルを追加
								}}
								onClick={() => handleMarkerClick(areaType as AreaType)} // onClick ハンドラを追加
							/>
							<input
								type="checkbox"
								id={`checkbox-${areaType}`}
								checked={areaVisibility[areaType as AreaType]}
								onChange={(e) => handleCheckboxChange(e, areaType as AreaType)}
							/>
							{areaName}
						</label>
					))}
				</div>
			</div>

			{isLoading && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: "white",
						zIndex: 2,
					}}
				>
					<img
						src={loadingImage}
						alt="Loading..."
						style={{ maxWidth: "80vw" }}
					/>
				</div>
			)}
		</div>
	);
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
