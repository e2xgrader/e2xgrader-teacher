import React, {useState} from "react";

export default function PointsInput({initialPoints, onChange}: {initialPoints: number, onChange: (val: number) => any}): React.JSX.Element {
    const [points, setPoints] = useState(initialPoints);

    function updatePoints(newPointsString: string): void {
        const newPoints = parseFloat(newPointsString.replace(',', '.'));
        setPoints(newPoints);
        onChange(newPoints);
    }

    return (<input type="number" value={points} onChange={e => updatePoints(e.target.value)} />);
}