import {E2xGraderMetadata} from '@e2xgrader/core';
import React, { useState } from 'react';

export const TASK_LINK_SELECTOR_CLASS = 'e2xgrader-task-link-selector';

export default function TaskLinkSelector({
  initiallyLinkedTask,
  onChange,
  tasks
}: {
  initiallyLinkedTask: E2xGraderMetadata.IE2xGraderTaskMetadata | undefined;
  onChange: (val: E2xGraderMetadata.IE2xGraderTaskMetadata | undefined) => any;
  tasks: E2xGraderMetadata.IE2xGraderTaskMetadata[];
}): React.JSX.Element {
  const [linkedTaskId, setLinkedTaskId] = useState(initiallyLinkedTask?.id);

  function handleChange(val: string | undefined) {
    setLinkedTaskId(val);
    onChange(val ? tasks.find(task => task.id === val) : undefined);
  }

  return (
    <select
      className={TASK_LINK_SELECTOR_CLASS}
      value={linkedTaskId}
      onChange={e => handleChange(e.target.value)}
    >
      <option value={undefined} key={undefined}>-</option>
      {tasks.map(task => (
        <option value={task.id} key={task.id}>{task.name}</option>
      ))}
    </select>
  );
}
