export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  targetPattern: string;
  uris: Record<string, string>;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'arms-mbon',
    name: 'ARMS-MBON Marine Genomic Dataset',
    description: 'European Marine Biodiversity Observation Network genomic observatory dataset conforming to RO-Crate.',
    targetPattern: 'PT-01',
    uris: {
      resource: 'https://arms-mbon.org/data/baseline-2023',
      profile: 'https://w3id.org/ro/crate/1.1',
      profile_description: 'https://w3id.org/ro/crate/1.1.html',
      metadata: 'https://arms-mbon.org/data/baseline-2023/ro-crate-metadata.json'
    }
  },
  {
    id: 'eurobis-occurrences',
    name: 'EurOBIS Marine Biodiversity Occurrences',
    description: 'Standardized Darwin Core biodiversity distribution dataset with persistent citation DOI.',
    targetPattern: 'PT-04',
    uris: {
      resource: 'https://eurobis.org/dataset/123',
      metadata: 'https://eurobis.org/dataset/123.jsonld',
      cite_as: 'https://doi.org/10.14284/123',
      profile: 'https://dwc.tdwg.org/terms/'
    }
  },
  {
    id: 'north-sea-sensors',
    name: 'North Sea Buoy Telemetry Observation Stream',
    description: 'Real-time marine sensor stream providing OGC API and OpenAPI subsetting descriptions.',
    targetPattern: 'PT-05',
    uris: {
      resource: 'https://sensors.vliz.be/northsea/buoy-14',
      service_desc: 'https://sensors.vliz.be/api/openapi.json',
      service_doc: 'https://sensors.vliz.be/api/docs'
    }
  }
];
