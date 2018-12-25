import { BaseProvider, ProviderOptions, Logger, RecordData, RecordFilter, Record, RecordParams } from "dnsm";

export class MockProvider extends BaseProvider {

  requests: any[] = [];

  constructor(domain: string, opts: ProviderOptions, logger?: Logger) {
    super(domain, opts, logger);
  }

  async authenticate(): Promise<any> {
    this.requests.push(['authenticate', [this.domain, this.opts.token]]);
  }

  async create(params: RecordData): Promise<void> {
    this.requests.push(['create', params]);
  }

  async list(filter?: RecordFilter): Promise<Record[]> {
    this.requests.push(['list', filter]);
    return [];
  }

  async update(identifier: string, params?: RecordParams): Promise<void> {
    this.requests.push(['update', [identifier, params]]);
  }

  async delete(identifier: string, params?: RecordFilter): Promise<void> {
    this.requests.push(['delete', [identifier, params]]);
  }

  async updyn(identifier: string, params: RecordParams): Promise<void> {
    this.requests.push(['updyn', [identifier, params]]);
  }
}
