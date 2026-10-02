import {Notebook} from "@jupyterlab/notebook";
import {E2xGraderMetadata, GradingCellModel} from "@e2xgrader/core";

export function findAllTasks(notebook: Notebook): E2xGraderMetadata.IE2xGraderTaskMetadata[] {
    return notebook.widgets
        .map(cell => new GradingCellModel(cell.model.sharedModel).task) // get the task metadata
        .filter(val => val !== undefined)                               // ignore the cell if it has no metadata
        .filter(uniqueTaskFilter);                                      // ignore duplicates
}

function uniqueTaskFilter(value: E2xGraderMetadata.IE2xGraderTaskMetadata, index: number, array: E2xGraderMetadata.IE2xGraderTaskMetadata[]): boolean {
    return array.findIndex((task: E2xGraderMetadata.IE2xGraderTaskMetadata) => task.id === value.id) === index; // filter out all task-metadata objects that are not the first occurrence of this task id
}

export function findTaskCells(notebook: Notebook, taskId: string): GradingCellModel[] {
    return notebook.widgets
        .map(cell => new GradingCellModel(cell.model.sharedModel))
        .filter(cell => cell?.task?.id === taskId);
}