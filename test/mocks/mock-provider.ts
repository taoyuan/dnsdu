import {
  AbstractProvider,
  ProviderOptions,
  RecordData,
  RecordFilter,
  Record,
  RecordParams,
  registerProvider
} from "namex";

export class MockProvider extends AbstractProvider {

  requests: any[] = [];

  constructor(domain: string, opts: ProviderOptions) {
    super('mock', domain, opts);
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

  protected async _delete(identifier: string, params?: RecordFilter): Promise<number> {
    this.requests.push(['delete', [identifier, params]]);
    return 0;
  }

}

registerProvider('mock', MockProvider);
