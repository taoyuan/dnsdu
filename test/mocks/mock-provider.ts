import { BaseProvider, ProviderOptions, Logger, RecordData, RecordFilter, Record, RecordParams } from "namex";

export class MockProvider extends BaseProvider {

  requests: any[] = [];

  constructor(domain: string, opts: ProviderOptions, logger?: Logger) {
    super(domain, opts, logger);
  }

  protected async _authenticate(): Promise<any> {
    this.requests.push(['authenticate', [this.domain, this.opts.token]]);
  }

  protected async _create(params: RecordData): Promise<void> {
    this.requests.push(['create', params]);
  }

  protected async _list(filter?: RecordFilter): Promise<Record[]> {
    this.requests.push(['list', filter]);
    return [];
  }

  protected async _update(identifier: string, params: RecordParams): Promise<void> {
    this.requests.push(['update', [identifier, params]]);
  }

  protected async _delete(identifier: string, params?: RecordFilter): Promise<void> {
    this.requests.push(['delete', [identifier, params]]);
  }

}
