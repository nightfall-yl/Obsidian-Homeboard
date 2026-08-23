/* eslint-disable @typescript-eslint/only-throw-error */
import { GraphProcessError } from "heatmap/processor/graphProcessError";
import type { BaseDataviewDataSourceQuery } from "./baseDataviewSourceQuery";
import type { DataSource } from "./types";
import type { App } from "obsidian";
import { DataviewPageDataSourceQuery } from "./dataviewPageDataSourceQuery";
import { DataviewTaskDataSourceQuery } from "./dataviewTaskDataSourceQuery";

export class CompositeDataSourceQuery {

    private dataSourceQueries: BaseDataviewDataSourceQuery[] = [
        new DataviewPageDataSourceQuery(),
        new DataviewTaskDataSourceQuery(),
    ];

    query(source: DataSource, app: App) {
        const dataSourceQuery = this.dataSourceQueries.find(query => query.accept(source));
        if (!dataSourceQuery) {
            throw new GraphProcessError({
                summary: "Unsupported data source",
                recommends: [
                    "Please use supported data source",
                ]
            });
        }
        return dataSourceQuery.query(source, app);
    }
}
