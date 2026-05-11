import React, {useState} from "react";

export default function TaskNameInput({initialName, onChange}: {initialName: string, onChange: (val: string) => any}): React.JSX.Element {
    const [taskName, setTaskName] = useState(initialName);

    function updateTaskName(newName: string): void{
        setTaskName(newName);
        onChange(newName);
    }

    return (<input type="text" value={taskName} onChange={e => updateTaskName(e.target.value)} placeholder="task name" />);
}