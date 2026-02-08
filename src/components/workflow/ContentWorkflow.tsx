'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import IdeaInputNode from './nodes/IdeaInputNode';
import ToneContextNode from './nodes/ToneContextNode';
import BrandDNANode from './nodes/BrandDNANode';
import ContentGeneratorNode from './nodes/ContentGeneratorNode';
import VariationsNode from './nodes/VariationsNode';
import EditRefineNode from './nodes/EditRefineNode';
import MediaAttachNode from './nodes/MediaAttachNode';
import XPreviewNode from './nodes/XPreviewNode';
import AnimatedBezierEdge from './edges/AnimatedBezierEdge';
import { useWorkflowStore } from './useWorkflowStore';
import { NODE_ACCENT_COLORS } from './workflow.types';
import { RotateCcw, Maximize2 } from 'lucide-react';

// ===== Node type registry =====
const nodeTypes: NodeTypes = {
  ideaInput: IdeaInputNode,
  toneContext: ToneContextNode,
  brandDNA: BrandDNANode,
  contentGenerator: ContentGeneratorNode,
  variations: VariationsNode,
  editRefine: EditRefineNode,
  mediaAttach: MediaAttachNode,
  xPreview: XPreviewNode,
};

// ===== Edge type registry =====
const edgeTypes: EdgeTypes = {
  animatedBezier: AnimatedBezierEdge,
};

// ===== Default node positions =====
const defaultNodes: Node[] = [
  {
    id: 'idea',
    type: 'ideaInput',
    position: { x: 0, y: 80 },
    data: {},
  },
  {
    id: 'tone',
    type: 'toneContext',
    position: { x: 340, y: 80 },
    data: {},
  },
  {
    id: 'brandDNA',
    type: 'brandDNA',
    position: { x: 340, y: 360 },
    data: {},
  },
  {
    id: 'generator',
    type: 'contentGenerator',
    position: { x: 700, y: 80 },
    data: {},
  },
  {
    id: 'variations',
    type: 'variations',
    position: { x: 1060, y: 60 },
    data: {},
  },
  {
    id: 'edit',
    type: 'editRefine',
    position: { x: 1480, y: 80 },
    data: {},
  },
  {
    id: 'media',
    type: 'mediaAttach',
    position: { x: 1480, y: 400 },
    data: {},
  },
  {
    id: 'preview',
    type: 'xPreview',
    position: { x: 1860, y: 60 },
    data: {},
  },
];

// ===== Default edges with colors =====
const defaultEdges: Edge[] = [
  {
    id: 'idea-tone',
    source: 'idea',
    target: 'tone',
    sourceHandle: 'topic',
    targetHandle: 'topic-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.ideaInput },
  },
  {
    id: 'tone-gen',
    source: 'tone',
    target: 'generator',
    sourceHandle: 'tone-out',
    targetHandle: 'topic-tone-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.toneContext },
  },
  {
    id: 'dna-gen',
    source: 'brandDNA',
    target: 'generator',
    sourceHandle: 'dna-out',
    targetHandle: 'dna-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.brandDNA },
  },
  {
    id: 'gen-vars',
    source: 'generator',
    target: 'variations',
    sourceHandle: 'variations-out',
    targetHandle: 'variations-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.contentGenerator },
  },
  {
    id: 'vars-edit',
    source: 'variations',
    target: 'edit',
    sourceHandle: 'selected-out',
    targetHandle: 'draft-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.variations },
  },
  {
    id: 'media-edit',
    source: 'media',
    target: 'edit',
    sourceHandle: 'media-out',
    targetHandle: 'media-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.mediaAttach },
  },
  {
    id: 'edit-preview',
    source: 'edit',
    target: 'preview',
    sourceHandle: 'final-out',
    targetHandle: 'preview-in',
    type: 'animatedBezier',
    data: { color: NODE_ACCENT_COLORS.editRefine },
  },
];

function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const { isGenerating, reset } = useWorkflowStore();
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'animatedBezier',
            data: { color: '#00FF41' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Update edges to show flowing animation when generating
  const animatedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isFlowing: isGenerating,
      },
    }));
  }, [edges, isGenerating]);

  const handleReset = useCallback(() => {
    reset();
    setNodes(defaultNodes);
    setEdges(defaultEdges);
  }, [reset, setNodes, setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 400 });
  }, [fitView]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[600px]">
      {/* Toolbar */}
      <div
        className="absolute top-4 left-4 z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 15, 15, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
          <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
            Content Workflow
          </span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
          title="Reset workflow"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={animatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
        className="workflow-canvas"
        style={{ background: '#0a0a0a' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.03)"
        />
        <Controls
          showInteractive={false}
          className="workflow-controls"
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const type = node.type as keyof typeof NODE_ACCENT_COLORS;
            return NODE_ACCENT_COLORS[type] || '#ffffff';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            background: 'rgba(15, 15, 15, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </ReactFlow>

      {/* Fit View button */}
      <button
        onClick={handleFitView}
        className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] text-white/40 hover:text-white/70 transition-all"
        style={{
          background: 'rgba(15, 15, 15, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Maximize2 className="w-3 h-3" />
        Fit View
      </button>
    </div>
  );
}

export default function ContentWorkflow() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
