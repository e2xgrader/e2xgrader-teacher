import {GradingCellModel} from "@e2xgrader/core";
import React, {useState} from "react";

export default function TaskLinkSelector({initiallyLinkedTask, onChange, solutionCells}: {initiallyLinkedTask: string|string[]|undefined, onChange: (val: string|undefined) => any, solutionCells: GradingCellModel[]}): React.JSX.Element {
    const [linkedTask, setLinkedTask] = useState(initiallyLinkedTask);

    function handleChange(val: string|undefined){
        setLinkedTask(val);
        onChange(val);
    }

    return (<select value={linkedTask} onChange={e => handleChange(e.target.value)}>
        <option value={undefined}>-</option>
        {solutionCells.map(cell => (<option value={cell.id}>{cell.taskName}</option>))}
    </select>);
}