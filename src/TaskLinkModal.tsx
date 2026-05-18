import {ReactWidget} from "@jupyterlab/ui-components";
import React from "react";
import TaskLinkSelector from "./TaskLinkSelector";
import {GradingCellModel} from "@e2xgrader/core";

export const TASK_LINK_MODAL_CLASS = 'e2x-task-link-modal';

export class TaskLinkModal extends ReactWidget {
    private currentValue: string|string[]|undefined;

    constructor(
        private initiallyLinkedTask: string|string[]|undefined,
        private solutionCells: GradingCellModel[]
    ) {
        super();
        this.currentValue = initiallyLinkedTask;
    }

    render(): React.JSX.Element {
        return (<div className={TASK_LINK_MODAL_CLASS}>
            <TaskLinkSelector initiallyLinkedTask={this.initiallyLinkedTask} onChange={e => {this.currentValue = e}} solutionCells={this.solutionCells} />
        </div>);
    }

    getValue(): string|string[]|undefined {
        return this.currentValue;
    }
}