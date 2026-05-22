import {Notebook} from "@jupyterlab/notebook";
import {GradingCellModel} from "@e2xgrader/core";

export function findLinkedCells(notebook?: Notebook, targetId?: string): GradingCellModel[]{
    return notebook?.widgets.map(cell => new GradingCellModel(cell.model.sharedModel)).filter(cell => cell.for === targetId) ?? [];
}

export function removeLink(cell: GradingCellModel, targetId: string){
    function throwNotLinkedError(): void{
        throw new Error('Unable to remove link! Cell is not linked to specified target');
    }

    console.log(cell.for, targetId);

    if(Array.isArray(cell.for)){
        if(!cell.for.includes(targetId)) throwNotLinkedError();
        cell.for = cell.for.filter(id => id !== targetId);
        if(cell.for.length === 0) cell.for = undefined;
    }else {
        if(cell.for !== targetId) throwNotLinkedError();
        cell.for = undefined;
    }
}