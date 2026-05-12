import React, {useState} from "react";
import {GradingCellModel} from "@e2xgrader/core";

export default function TaskLink({initiallyLinkedTask, onChange, gradingCells}: {initiallyLinkedTask: string|string[]|undefined, onChange: (val: string|undefined) => any, gradingCells: GradingCellModel[]}): React.JSX.Element{
    const [linkedTask, setLinkedTask] = useState(initiallyLinkedTask);

    console.log(gradingCells);
    console.log(setLinkedTask);

    return (<span>{linkedTask ? 'task' : '+ link to task'}</span>);
}