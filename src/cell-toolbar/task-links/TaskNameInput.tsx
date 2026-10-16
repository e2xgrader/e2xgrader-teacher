import React, { useState } from 'react';

export const TASK_NAME_MIN_LENGTH = 1;
export const TASK_NAME_MAX_LENGTH = 128;

export default function TaskNameInput({
  initialName,
  onChange,
  otherTaskNames,
  onError,
  onTouched
}: {
  initialName: string;
  onChange: (val: string) => any;
  otherTaskNames: string[];
  onError: (errors: string[]) => any;
  onTouched?: () => any;
}): React.JSX.Element {
  const [taskName, setTaskName] = useState(initialName);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  if (!isValidated) {
    setIsValidated(true);
    handleValidation(taskName);
  }

  function updateTaskName(newName: string): void {
    setIsTouched(true);
    if (onTouched) {
      onTouched();
    }
    setTaskName(newName);
    newName = newName.trim(); //remove leading & trailing whitespace
    const newErrors = handleValidation(newName);
    if (newErrors.length === 0) {
      onChange(newName);
    }
  }

  function handleValidation(newName: string): string[] {
    const newErrors = [];
    if (newName.length < TASK_NAME_MIN_LENGTH) {
      newErrors.push('minLength');
    }
    if (newName.length > TASK_NAME_MAX_LENGTH) {
      newErrors.push('maxLength');
    }
    if (otherTaskNames.includes(newName)) {
      newErrors.push('duplicate');
    }
    setErrors(newErrors);
    onError(newErrors);
    return newErrors;
  }

  return (
    <input
      className={isTouched && errors.length > 0 ? 'invalid' : ''}
      type="text"
      value={taskName}
      onChange={e => updateTaskName(e.target.value)}
      placeholder="task name"
    />
  );
}
