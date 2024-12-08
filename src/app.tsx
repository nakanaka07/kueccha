// src/app.tsx
import React, {
	useState,
	useMemo,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import loadingImage from "./row1.png";

const App: React.FC = () => {
	// エリア表示状態初期値 (全表示)
	const initialAreaVisibility = useMemo(
		() =>
			Object.values(AREAS).reduce(
				(acc, areaName) => {
					acc[areaName] = true;
					return acc;
				},
				{} as Record<AreaName, boolean>
			),
		[]
	);

	const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);
	const { pois, isLoading, error } = useSheetData(
		Object.keys(AREAS) as AreaType[]
	);

	// 表示POIを絞り込み
	const filteredPois = useMemo(
		() => pois.filter((poi) => areaVisibility[AREAS[poi.area]]),
		[pois, areaVisibility]
	);

	// チェックボックス変更ハンドラ
	const handleCheckboxChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
			setAreaVisibility((prev) => ({ ...prev, [areaName]: e.target.checked }));
		},
		[]
	);

	const [showLoader, setShowLoader] = useState(true);
	const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);

	const checkboxAreaStyle = useMemo(
		() => ({
			opacity: isCheckboxVisible ? 1 : 0,
			transition: "opacity 0.3s ease-in-out",
			position: "absolute" as const,
			top: "120px",
			left: "10px",
			zIndex: 1,
			backgroundColor: "white",
			padding: "10px",
		}),
		[isCheckboxVisible]
	);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mapContainerRef = useRef<HTMLDivElement | null>(null);

	// ローディング表示制御
	useEffect(() => {
		// マップコンテナが描画されてロードが完了したらローディングを非表示
		if (!isLoading && showLoader && mapContainerRef.current) {
			timerRef.current = setTimeout(() => setShowLoader(false), 500);
		}

		return () =>
			clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
	}, [isLoading, showLoader, mapContainerRef.current]);

	if (error) return <div>エラー: {error}</div>;

	return (
		<div
			style={{
				width: "100%",
				height: "100vh",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* ローディング画面 */}
			{showLoader && (
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
						opacity: showLoader ? 1 : 0,
						transition: "opacity 4s ease-in-out",
						zIndex: 2,
					}}
				>
					<img
						src={loadingImage}
						alt="Loading..."
						style={{ maxWidth: "80vw", maxHeight: "80vh" }}
					/>{" "}
					{/* 画像サイズ調整 */}
				</div>
			)}

			<div
				ref={mapContainerRef}
				style={{
					opacity: showLoader ? 0 : 1,
					transition: "opacity 4s ease-in-out",
					width: "100%",
					height: "100%",
					position: "relative",
				}}
			>
				<button
					onClick={() => setIsCheckboxVisible(!isCheckboxVisible)}
					style={{ position: "absolute", top: "90px", left: "10px", zIndex: 2 }}
				>
					{isCheckboxVisible
						? "チェックボックスを隠す"
						: "チェックボックスを表示"}
				</button>

				<div style={checkboxAreaStyle}>
					{Object.entries(AREAS).map(([areaKey, areaName]) => (
						<div key={areaKey}>
							<input
								type="checkbox"
								id={areaKey}
								checked={areaVisibility[areaName]}
								onChange={(e) => handleCheckboxChange(e, areaName)}
							/>
							<label htmlFor={areaKey}>{areaName}</label>
						</div>
					))}
				</div>

				<Map key={filteredPois.length} pois={filteredPois} />
			</div>
		</div>
	);
};

const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
