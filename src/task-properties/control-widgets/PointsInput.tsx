import React, { useState } from 'react';

export default function PointsInput({
  initialPoints,
  onChange,
  onError,
  onTouched
}: {
  initialPoints: number;
  onChange: (val: number) => any;
  onError: (errors: string[]) => any;
  onTouched?: () => any;
}): React.JSX.Element {
  const [points, setPoints] = useState(initialPoints);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  function updatePoints(newPointsString: string): void {
    setIsTouched(true);
    if (onTouched) {
      onTouched();
    }
    const newPoints = parseFloat(newPointsString.replace(',', '.'));
    setPoints(newPoints);
    const newErrors: string[] = handleValidation(newPoints);
    setErrors(newErrors);
    onError(newErrors);
    if (newErrors.length < 1) {
      onChange(newPoints);
    }
  }

  function handleValidation(newPoints: number): string[] {
    const newErrors = [];
    if (newPoints < 0) {
      newErrors.push('min');
    }
    if (!Number.isFinite(newPoints)) {
      newErrors.push('finiteNumber');
    }
    return newErrors;
  }

  if (!isValidated) {
    setIsValidated(true);
    handleValidation(points);
  }

  return (
    <input
      type="number"
      className={isTouched && errors.length > 0 ? 'invalid' : ''}
      step={0.5}
      value={points}
      min={0}
      onChange={e => updatePoints(e.target.value)}
    />
  );
}
