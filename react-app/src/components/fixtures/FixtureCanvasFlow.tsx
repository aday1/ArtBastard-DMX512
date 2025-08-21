import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Fixture, PlacedFixture, useStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { LucideIcon } from '../ui/LucideIcon';
import { FixtureNode } from './nodes/FixtureNode';
import { ControlPanel } from './panels/ControlPanel';
import styles from './FixtureCanvasFlow.module.scss';

interface FixtureCanvasFlowProps {
  fixtures: Fixture[];
  placedFixturesData: PlacedFixture[];
  onUpdatePlacedFixtures: (fixtures: PlacedFixture[]) => void;
}

// Custom node types
const nodeTypes: NodeTypes = {
  fixture: FixtureNode,
};

export const FixtureCanvasFlow: React.FC<FixtureCanvasFlowProps> = ({
  fixtures,
  placedFixturesData,
  onUpdatePlacedFixtures
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'add'>('select');
  const [fixtureToAdd, setFixtureToAdd] = useState<string>('');
  const [showControls, setShowControls] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const { 
    dmxChannels,
    setDmxChannelValue,
    startMidiLearn,
    midiLearnTarget,
    addNotification
  } = useStore();

  const { socket } = useSocket();

  // Convert placed fixtures to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = placedFixturesData.map(placedFixture => {
      const fixtureDef = fixtures.find(f => f.id === placedFixture.fixtureStoreId);
      if (!fixtureDef) return null;

      return {
        id: placedFixture.id,
        type: 'fixture',
        position: { x: placedFixture.x, y: placedFixture.y },
        data: {
          fixture: fixtureDef,
          placedFixture,
          onSelect: () => {
            setSelectedFixture(placedFixture.id);
            setShowControls(true);
          },
          onChannelChange: (channelIndex: number, value: number) => {
            handleChannelChange(placedFixture.id, channelIndex, value);
          },
          onMidiLearn: (channelIndex: number) => {
            startMidiLearnForChannel(placedFixture.id, channelIndex);
          },
          onOscCopy: (channelIndex: number) => {
            copyOscAddress(placedFixture.id, channelIndex);
          },
        },
        draggable: true,
        selectable: true,
      };
    }).filter(Boolean) as Node[];

    setNodes(flowNodes);
  }, [placedFixturesData, fixtures]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const position = snapToGrid 
        ? { 
            x: Math.round(node.position.x / 50) * 50, 
            y: Math.round(node.position.y / 50) * 50 
          }
        : node.position;

      updatePlacedFixturePosition(node.id, position.x, position.y);
    },
    [snapToGrid]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (selectedTool === 'add' && fixtureToAdd) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        addFixtureToCanvas(fixtureToAdd, x, y);
        setSelectedTool('select');
      } else {
        setSelectedFixture(null);
        setShowControls(false);
      }
    },
    [selectedTool, fixtureToAdd]
  );

  const addFixtureToCanvas = (fixtureType: string, x: number, y: number) => {
    const fixtureDef = fixtures.find(f => f.id === fixtureType);
    if (!fixtureDef) return;

    const newPlacedFixture: PlacedFixture = {
      id: `placed-${Date.now()}`,
      fixtureStoreId: fixtureDef.id,
      name: `${fixtureDef.name} ${placedFixturesData.length + 1}`,
      x: snapToGrid ? Math.round(x / 50) * 50 : x,
      y: snapToGrid ? Math.round(y / 50) * 50 : y,
      startAddress: getNextAvailableAddress(),
      scale: 1,
    };

    const updatedFixtures = [...placedFixturesData, newPlacedFixture];
    onUpdatePlacedFixtures(updatedFixtures);

    addNotification?.({
      type: 'success',
      message: `Added ${fixtureDef.name} to canvas`,
    });

    setFixtureToAdd('');
  };

  const getNextAvailableAddress = (): number => {
    if (placedFixturesData.length === 0) return 1;
    const usedAddresses = placedFixturesData.map(f => f.startAddress).sort((a, b) => a - b);
    let nextAddress = 1;
    for (const addr of usedAddresses) {
      if (nextAddress < addr) break;
      nextAddress = addr + 1;
    }
    return nextAddress;
  };

  const updatePlacedFixturePosition = (fixtureId: string, x: number, y: number) => {
    const updatedFixtures = placedFixturesData.map(f => 
      f.id === fixtureId ? { ...f, x, y } : f
    );
    onUpdatePlacedFixtures(updatedFixtures);
  };

  const deleteSelectedFixture = () => {
    if (!selectedFixture) return;

    const updatedFixtures = placedFixturesData.filter(f => f.id !== selectedFixture);
    onUpdatePlacedFixtures(updatedFixtures);
    setSelectedFixture(null);
    setShowControls(false);

    addNotification?.({
      type: 'info',
      message: 'Fixture removed from canvas',
    });
  };

  const handleChannelChange = (fixtureId: string, channelIndex: number, value: number) => {
    const placedFixture = placedFixturesData.find(f => f.id === fixtureId);
    if (!placedFixture) return;

    const dmxChannel = placedFixture.startAddress + channelIndex;
    setDmxChannelValue(dmxChannel, value);

    if (socket?.emit) {
      socket.emit('dmx:setValue', {
        channel: dmxChannel,
        value,
      });
    }
  };

  const startMidiLearnForChannel = (fixtureId: string, channelIndex: number) => {
    const controlId = `fixture-${fixtureId}-ch${channelIndex}`;
    startMidiLearn({ type: 'placedControl', fixtureId, controlId });
  };

  const copyOscAddress = (fixtureId: string, channelIndex: number) => {
    const oscAddress = `/fixture/${fixtureId}/channel/${channelIndex}`;
    navigator.clipboard?.writeText(oscAddress);
    
    addNotification?.({
      type: 'success',
      message: `OSC address copied: ${oscAddress}`,
    });
  };

  const getSelectedFixtureData = () => {
    if (!selectedFixture) return null;
    return placedFixturesData.find(f => f.id === selectedFixture);
  };

  const getSelectedFixtureDef = () => {
    const placedFixture = getSelectedFixtureData();
    if (!placedFixture) return null;
    return fixtures.find(f => f.id === placedFixture.fixtureStoreId);
  };

  return (
    <div className={styles.canvasContainer}>
      {/* Professional Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolButton} ${selectedTool === 'select' ? styles.active : ''}`}
              onClick={() => setSelectedTool('select')}
              title="Select and move fixtures"
            >
              <LucideIcon name="MousePointer" />
              Select
            </button>
            <button
              className={`${styles.toolButton} ${selectedTool === 'add' ? styles.active : ''}`}
              onClick={() => setSelectedTool('add')}
              title="Add new fixtures to canvas"
            >
              <LucideIcon name="Plus" />
              Add Fixture
            </button>
          </div>

          {selectedTool === 'add' && (
            <div className={styles.toolGroup}>
              <select
                className={styles.fixtureSelect}
                value={fixtureToAdd}
                onChange={(e) => setFixtureToAdd(e.target.value)}
              >
                <option value="">Select fixture type...</option>
                {fixtures.map(fixture => (
                  <option key={fixture.id} value={fixture.id}>
                    {fixture.name} ({fixture.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.toolSection}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toggleButton} ${snapToGrid ? styles.active : ''}`}
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Snap to grid"
            >
              <LucideIcon name="Magnet" />
              Snap
            </button>
          </div>

          {selectedFixture && (
            <div className={styles.toolGroup}>
              <button
                className={styles.deleteButton}
                onClick={deleteSelectedFixture}
                title="Delete selected fixture"
              >
                <LucideIcon name="Trash2" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className={styles.statusSection}>
          <span className={styles.fixtureCount}>
            {placedFixturesData.length} fixtures
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className={styles.flowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className={styles.reactFlow}
          snapToGrid={snapToGrid}
          snapGrid={[50, 50]}
          connectionLineStyle={{ stroke: '#00d4ff', strokeWidth: 2 }}
          defaultEdgeOptions={{ 
            style: { stroke: '#00d4ff', strokeWidth: 2 },
            type: 'smoothstep' 
          }}
        >
          <Controls className={styles.controls} />
          <MiniMap 
            className={styles.minimap}
            nodeColor="#00d4ff"
            maskColor="rgba(0, 0, 0, 0.8)"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={50} 
            size={1}
            color="#333"
          />
          
          {/* Custom Panel for Canvas Tools */}
          <Panel position="top-right" className={styles.canvasPanel}>
            <div className={styles.panelContent}>
              <h4>
                <LucideIcon name="Layers" />
                Canvas Tools
              </h4>
              <div className={styles.panelActions}>
                <button 
                  className={styles.panelButton}
                  onClick={() => setNodes([])}
                  title="Clear all fixtures"
                >
                  <LucideIcon name="Trash2" />
                  Clear All
                </button>
                <button 
                  className={styles.panelButton}
                  title="Save canvas layout"
                >
                  <LucideIcon name="Save" />
                  Save Layout
                </button>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Advanced Control Panel */}
      {showControls && selectedFixture && (
        <ControlPanel
          fixture={getSelectedFixtureDef()}
          placedFixture={getSelectedFixtureData()}
          dmxChannels={dmxChannels}
          onChannelChange={(channelIndex, value) => 
            handleChannelChange(selectedFixture, channelIndex, value)
          }
          onMidiLearn={(channelIndex) => 
            startMidiLearnForChannel(selectedFixture, channelIndex)
          }
          onOscCopy={(channelIndex) => 
            copyOscAddress(selectedFixture, channelIndex)
          }
          onClose={() => setShowControls(false)}
          isLearning={(channelIndex) => 
            midiLearnTarget?.type === 'placedControl' &&
            midiLearnTarget.fixtureId === selectedFixture
          }
        />
      )}
    </div>
  );
};

export default FixtureCanvasFlow;
