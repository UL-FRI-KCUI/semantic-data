import cytoscape from 'cytoscape';
import { useEffect, useRef, useState } from 'react';
import { parseTurtle } from '../lib/rdf';

function shortName(value: string) {
  const hash = value.lastIndexOf('#');
  const slash = value.lastIndexOf('/');
  return decodeURIComponent(value.slice(Math.max(hash, slash) + 1)) || value;
}

export default function GraphView({ turtle }: { turtle: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!container.current) return;

    try {
      const quads = parseTurtle(turtle);
      const nodes = new Map<string, { data: { id: string; label: string; kind: string } }>();
      const edges: { data: { id: string; source: string; target: string; label: string } }[] = [];

      const nodeId = (termType: string, value: string, language = '') => `${termType}:${value}:${language}`;
      for (const [index, quad] of quads.entries()) {
        const source = nodeId(quad.subject.termType, quad.subject.value);
        const target = nodeId(quad.object.termType, quad.object.value, quad.object.termType === 'Literal' ? quad.object.language : '');
        nodes.set(source, { data: { id: source, label: shortName(quad.subject.value), kind: 'resource' } });
        nodes.set(target, {
          data: {
            id: target,
            label: quad.object.termType === 'Literal' ? `“${quad.object.value}”${quad.object.language ? `@${quad.object.language}` : ''}` : shortName(quad.object.value),
            kind: quad.object.termType === 'Literal' ? 'literal' : 'resource',
          },
        });
        edges.push({ data: { id: `edge-${index}`, source, target, label: shortName(quad.predicate.value) } });
      }

      const graph = cytoscape({
        container: container.current,
        elements: [...nodes.values(), ...edges],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#c5003e',
              color: '#131e29',
              label: 'data(label)',
              'font-family': 'Calibri, Arial, sans-serif',
              'font-size': 12,
              'text-valign': 'bottom',
              'text-margin-y': 7,
              width: 24,
              height: 24,
            },
          },
          { selector: 'node[kind = "literal"]', style: { 'background-color': '#f9423a', shape: 'round-rectangle' } },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#aeb6be',
              'target-arrow-color': '#aeb6be',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              color: '#56616b',
              'font-size': 10,
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.9,
            },
          },
        ],
        layout: { name: 'cose', animate: false, randomize: false, padding: 28 },
      });
      setError('');
      return () => graph.destroy();
    } catch {
      setError('Graf bo prikazan, ko bo zapis Turtle sintaktično veljaven.');
    }
  }, [turtle]);

  return (
    <section className="graph-panel" aria-labelledby="graph-title">
      <div className="panel-heading">
        <span id="graph-title">Predogled grafa</span>
        <span className="panel-kicker">Cytoscape.js</span>
      </div>
      {error ? <p className="graph-empty">{error}</p> : null}
      <div ref={container} className="graph-canvas" role="img" aria-label="Graf razredov, lastnosti in njihovih povezav" />
    </section>
  );
}
