import React, {useState} from 'react';
import {E2xGraderCellRegistry, NbgraderCellTypes} from '@e2xgrader/core';

export default function CellTypeSelector({initialType, onChange, cellRegistry}: {initialType: string; onChange: (val: string) => any; cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined}): React.JSX.Element {
    const [currentType, setCurrentType] = useState<string|undefined>(initialType);
    const options: [string, string][] = [...Object.entries(NbgraderCellTypes.cellTypeLabels), ...(cellRegistry?.getPlugins().map((plugin: E2xGraderCellRegistry.IE2xGraderCellPlugin): [string, string] => [plugin.cellType, plugin.label]) ?? [])];
    function updateCellType(newType: string): void{
        setCurrentType(newType);
        onChange(newType);
    }

    return (<select value={currentType} onChange={e => updateCellType(e.target.value)}>
              <option value="">-</option>
              { options.map(([key, label]: [string, string]) => {
                return <option value={key}>{label}</option>;
              }) }
            </select>);
}