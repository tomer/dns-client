import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Form, Container, Row, Col, Button, Table, Card, Collapse } from 'react-bootstrap'

import ianaTypes from './data/iana-types.json'

export class DnsClient extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = { queryName: 'example.com', queryType: 'A', queryDNSSEC: false, queryNoValidation: false, resolver: this.resolvers[0]?.url }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    const commonRecordTypes = ['A', 'AAAA', 'TXT', 'MX'];
    const ignoredRecords = ['Reserved', 'Unassigned', 'Private use'];

    this.commonRecordTypes = [];
    this.otherRecordTypes = [];
    this.obsoleteRecordTypes = [];
    for (const record of Object.values(ianaTypes)) {
      if (ignoredRecords.includes(record.TYPE)) continue;
      else if (commonRecordTypes.includes(record.TYPE)) this.commonRecordTypes.push(record);
      else if (record.Meaning.includes('OBSOLETE')) this.obsoleteRecordTypes.push(record);
      else this.otherRecordTypes.push(record);
    }
  }

  resolvers = [{
    name: 'CloudFlare',
    url: 'https://cloudflare-dns.com/dns-query',
  }, {
    name: 'Google',
    url: 'https://dns.google/resolve',
  }];

  handleChange(event) {
    switch (event.target.type) {
      case 'checkbox': this.setState({ [event.target.name || event.target.id]: event.target.checked }); break;
      default: this.setState({ [event.target.name || event.target.id]: event.target.value });
    }
  }
  handleSubmit(event) {
    this.setState({ result: undefined });

    const url = `${this.state.resolver}?name=${this.state.queryName}&type=${this.state.queryType}`
      + `&ct=application/dns-json`
      + `${this.state.queryDNSSEC ? '&do' : ''}${this.state.queryNoValidation ? '&cd' : ''}`;

    fetch(url, {
      method: 'GET',
    })
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      );
    event.preventDefault();
  }

  render() {
    return (<>
      <Card body>
        <Container fluid>
          <Form onSubmit={this.handleSubmit}>
            <Row><Col md={2}>
              <Form.Group controlId="exampleForm.ControlInput1">
                <Form.Label>Query Type</Form.Label>

                <Form.Control name={'queryType'} onChange={this.handleChange}
                  as="select"
                  custom
                  isValid={!this.state.queryType}
                >
                  <optgroup label="Common record types">
                    {this.commonRecordTypes.map((item, index) =>
                      <option key={index} value={item.TYPE}
                        selected={this.state.queryType === item.TYPE} title={item.Meaning}>{item.TYPE}
                      </option>)}
                  </optgroup>
                  {this.otherRecordTypes.map((item, index) =>
                    <option key={index} value={item.TYPE}
                      selected={this.state.queryType === item.TYPE} title={item.Meaning}>{item.TYPE}
                    </option>)}
                  <optgroup label="Obsolete record types">
                    {this.obsoleteRecordTypes.map((item, index) =>
                      <option key={index} value={item.TYPE}
                        selected={this.state.queryType === item.TYPE} title={item.Meaning}>{item.TYPE}
                      </option>)}
                  </optgroup>
                </Form.Control>
              </Form.Group>
            </Col><Col md={7}>
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label>Query Name</Form.Label>
                  <Form.Control placeholder="example.net"
                    name={'queryName'}
                    isInvalid={!this.state.queryName}
                    defaultValue={this.state.queryName}
                    onChange={this.handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label>Resolver:{' '}</Form.Label>
                  <Form.Control name={'resolver'} onChange={this.handleChange}
                    as="select"
                    custom
                  >
                    {this.resolvers.map((resolver, index) =>
                      <option key={index} value={resolver.url}
                        selected={this.state.resolver === resolver.url}>{resolver.name}</option>
                    )}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3} sm={6}>
                <Form.Check
                  type="switch"
                  id="queryDNSSEC"
                  label="Provide DNSSEC data"
                  defaultChecked={this.state.queryDNSSEC}
                  onChange={this.handleChange} />
              </Col>
              <Col md={3} sm={6}>
                <Form.Check
                  type="switch"
                  id="queryNoValidation"
                  label="Disable validation"
                  defaultChecked={this.state.queryNoValidation}
                  onChange={this.handleChange} />
              </Col>
              <Col md={3} sm={6}>
                <Button variant="primary" type="submit">
                  Submit
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </Card>
      <Collapse in={this.state.result} mountOnEnter={true}><div>
        <Card body>
          {this.state.result?.Question?.map((record, index) =>
            <Card.Title key={index}>Results for {ianaTypes[record.type].Meaning} ({ianaTypes[record.type].TYPE}) {record.name}</Card.Title>
          )}
          <Container fluid>
            <Row>
              <Col>
                {[{ k: 'TC', d: 'DNS answer is larger than a single packet' },
                { k: 'RD', d: 'DNS Recursive Desired' },
                { k: 'RA', d: 'DNS Recursion Available' },
                { k: 'AD', d: 'All DNS records were verified against DNSSEC' },
                { k: 'CD', d: 'DNSSEC validation disabled' }].filter(bit =>
                  this.state.result?.[bit.k] === true).map(bit => bit.d).join(', ')}
              </Col>
            </Row>
            <Row>
              <Col>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>TTL</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.result?.Answer?.map((record, index) =>
                      <tr key={index}>
                        <td>{record.name}</td>
                        <td>{ianaTypes[record.type].TYPE}</td>
                        <td>{record.TTL}</td>
                        <td>{record.data}</td>
                      </tr>)}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Card></div>
      </Collapse></>
    );
  }
}