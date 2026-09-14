export interface RTRelationDef {
  rel: string;
  rfc: string;
  description: string;
  defaultRole: string;
  signposting: boolean;
}

export const RT_RELATIONS: Record<string, RTRelationDef> = {
  profile: {
    rel: 'profile',
    rfc: 'RFC 6906',
    description: 'Declares conformance to a functional specification or schema profile.',
    defaultRole: 'profile',
    signposting: true
  },
  describedby: {
    rel: 'describedby',
    rfc: 'RFC 8288',
    description: 'Links to descriptive machine-readable metadata (e.g. JSON-LD, Turtle).',
    defaultRole: 'metadata',
    signposting: true
  },
  'cite-as': {
    rel: 'cite-as',
    rfc: 'RFC 8574',
    description: 'Permanent persistent identifier for citation (DOI, Handle, URN).',
    defaultRole: 'persistent_id',
    signposting: true
  },
  type: {
    rel: 'type',
    rfc: 'RFC 8288',
    description: 'Conceptual RDF/schema type of the resource (e.g. dcat:Dataset).',
    defaultRole: 'resource_type',
    signposting: true
  },
  item: {
    rel: 'item',
    rfc: 'RFC 6573',
    description: 'Links a collection/catalog to a member item resource.',
    defaultRole: 'resource',
    signposting: true
  },
  collection: {
    rel: 'collection',
    rfc: 'RFC 6573',
    description: 'Links a resource back to its parent collection or catalog.',
    defaultRole: 'catalog',
    signposting: true
  },
  linkset: {
    rel: 'linkset',
    rfc: 'RFC 9264',
    description: 'Points to a dedicated RFC 9264 linkset document exposing relations.',
    defaultRole: 'linkset',
    signposting: true
  },
  alternate: {
    rel: 'alternate',
    rfc: 'RFC 8288',
    description: 'Links to an alternate format or profile representation.',
    defaultRole: 'alternate',
    signposting: false
  },
  'service-desc': {
    rel: 'service-desc',
    rfc: 'RFC 8631',
    description: 'Machine-readable API description (OpenAPI, GraphQL).',
    defaultRole: 'service_desc',
    signposting: false
  },
  'service-doc': {
    rel: 'service-doc',
    rfc: 'RFC 8631',
    description: 'Human-readable documentation for API or service.',
    defaultRole: 'service_doc',
    signposting: false
  }
};
