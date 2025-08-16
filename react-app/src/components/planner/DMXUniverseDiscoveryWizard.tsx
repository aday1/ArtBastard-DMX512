import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../store';
import useStoreUtils from '../../store/storeUtils';
import { LucideIcon } from '../ui/LucideIcon';
import { v4 as uuidv4 } from 'uuid';
import styles from './DMXUniverseDiscoveryWizard.module.scss';
import { InteractiveChannelExplorer } from './InteractiveChannelExplorer';

interface DiscoveredFixture {
  id: string;
  name: string;
  type: string;
  startAddress: number;
  channelCount: number;
  channels: {
    type: string;
    name: string;
    dmxAddress: number;
  }[];
}

interface WizardStep {
  id: string;
  title: string;
  artsnobTitle: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Welcome', artsnobTitle: '🎭 Welcome to the Fixture Discovery Zone' },
  { id: 'setup', title: 'Fixture Setup', artsnobTitle: '📝 Tell Us About Your Mystery Fixture' },
  { id: 'explore', title: 'Channel Exploration', artsnobTitle: '🔬 Interactive Channel Exploration' },
  { id: 'save', title: 'Save Profile', artsnobTitle: '💾 Save Your Discovered Fixture' },
  { id: 'complete', title: 'Complete', artsnobTitle: '🎉 Fixture Profile Saved!' }
];

export const DMXUniverseDiscoveryWizard: React.FC = () => {
  const { theme } = useTheme();
  const { addFixture } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [fixtureName, setFixtureName] = useState('New Fixture');
  const [channelCount, setChannelCount] = useState(16);
  const [startAddress, setStartAddress] = useState(1);
  const [tempFixtureId, setTempFixtureId] = useState('');

  const [discoveredProfile, setDiscoveredProfile] = useState<any>(null);

  const currentStepData = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const nextStep = () => {
    if (currentStep === 1) { // After setup
      const newFixture = {
        id: uuidv4(),
        name: fixtureName,
        type: 'unknown',
        startAddress: startAddress,
        channels: Array.from({ length: channelCount }).map((_, i) => ({
          name: `Channel ${i + 1}`,
          type: 'other',
          dmxAddress: startAddress + i,
        })),
        notes: 'Fixture being discovered.'
      };
      setTempFixtureId(newFixture.id);
      // We don't add it to the main store yet, just using this to pass to explorer
    }
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProfileSave = (profile: any) => {
    setDiscoveredProfile(profile);
    nextStep();
  };

  const applyFixtureToSystem = () => {
    if (!discoveredProfile) return;

    const finalFixture = {
        ...discoveredProfile,
        name: fixtureName,
        type: 'custom', // Or derive from profile
        startAddress: startAddress,
        notes: `Discovered via wizard.`,
    };

    addFixture(finalFixture);

    useStoreUtils.getState().addNotification({
      message: `Successfully added "${fixtureName}" to the system!`,
      type: 'success',
      priority: 'normal'
    });
  };

  const renderWelcomeStep = () => (
    <div className={styles.stepContent}>
      <div className={styles.welcomeHeader}>
        <h3>{theme === 'artsnob' ? '🎭 Greetings, DMX Detective!' : 'Fixture Discovery Wizard'}</h3>
        <p>{theme === 'artsnob' ? 'Got a light with a manual written in riddles? You\'re in the right place. This wizard helps you probe, test, and map out any DMX fixture, channel by channel.' : 'This wizard will help you discover the channel layout of an unknown DMX fixture.'}</p>
      </div>
    </div>
  );

  const renderSetupStep = () => (
    <div className={styles.stepContent}>
      <h3>{theme === 'artsnob' ? '📝 The Dossier on Your Enigmatic Emitter' : 'Fixture Details'}</h3>
      <p>{theme === 'artsnob' ? 'Give us the basic intel. We need a name, its channel footprint, and where it lives on the DMX highway.' : 'Enter the basic information for the fixture you want to discover.'}</p>
      <div className={styles.inputGroup}>
        <label>Fixture Name:</label>
        <input
          type="text"
          value={fixtureName}
          onChange={(e) => setFixtureName(e.target.value)}
          placeholder="e.g., 'Mysterious Moving Head'"
          className={styles.textInput}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Number of Channels:</label>
        <input
          type="number"
          min="1"
          max="512"
          value={channelCount}
          onChange={(e) => setChannelCount(parseInt(e.target.value) || 1)}
          className={styles.numberInput}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Starting DMX Address:</label>
        <input
          type="number"
          min="1"
          max="512"
          value={startAddress}
          onChange={(e) => setStartAddress(parseInt(e.target.value) || 1)}
          className={styles.numberInput}
        />
      </div>
    </div>
  );

  const renderExploreStep = () => (
    <div className={styles.stepContent}>
        <h3>{theme === 'artsnob' ? '🔬 The Examination Room' : 'Interactive Explorer'}</h3>
        <p>{theme === 'artsnob' ? 'Time to play! Wiggle the sliders and see what happens. When you figure out a channel\'s purpose, label it. The fixture should respond in real-time.' : 'Use the sliders to control each DMX channel and assign its function from the dropdown.'}</p>
        <InteractiveChannelExplorer
            fixtureId={tempFixtureId}
            channelCount={channelCount}
            onSave={handleProfileSave}
        />
    </div>
  );

  const renderSaveStep = () => (
    <div className={styles.stepContent}>
        <h3>{theme === 'artsnob' ? '💾 Codify Your Discovery' : 'Save Fixture Profile'}</h3>
        <p>{theme === 'artsnob' ? `You've cracked the code for "${fixtureName}". Shall we commit this knowledge to the grand library?` : `Review the discovered profile for "${fixtureName}" and save it to your workspace.`}</p>
        
        <div className={styles.profileReview}>
            <h4>Discovered Profile for "{fixtureName}"</h4>
            <ul>
                {discoveredProfile?.channels.map((ch: any, i: number) => (
                    <li key={i}>Channel {i+1}: <strong>{ch.type}</strong></li>
                ))}
            </ul>
        </div>

        <button onClick={applyFixtureToSystem} className={styles.primaryButton}>
            <LucideIcon name="Save" /> Save to My Fixtures
        </button>
    </div>
  );


  const renderCompleteStep = () => (
    <div className={styles.stepContent}>
      <div className={styles.completionHeader}>
        <h3>{theme === 'artsnob' ? '🎉 Another Mystery Solved!' : 'Setup Complete!'}</h3>
        <p>{theme === 'artsnob' ? `The secrets of "${fixtureName}" are secrets no more. It has been added to your collection of controllable marvels.` : `The fixture "${fixtureName}" has been configured and added to your system.`}</p>
        <div className={styles.actionButtons}>
          <button onClick={() => setCurrentStep(0)} className={styles.secondaryButton}>
            <LucideIcon name="Plus" /> Discover Another Fixture
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep();
      case 1: return renderSetupStep();
      case 2: return renderExploreStep();
      case 3: return renderSaveStep();
      case 4: return renderCompleteStep();
      default: return renderWelcomeStep();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return fixtureName && channelCount > 0 && startAddress > 0;
      default: return true;
    }
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardHeader}>
        <h2>{theme === 'artsnob' ? currentStepData.artsnobTitle : currentStepData.title}</h2>
        <div className={styles.stepIndicator}>
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className={`${styles.stepNode} ${index === currentStep ? styles.active : index < currentStep ? styles.completed : ''}`}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.wizardBody}>
        {renderCurrentStep()}
      </div>

      <div className={styles.wizardFooter}>
        <button onClick={prevStep} disabled={isFirstStep || currentStep === 2 || currentStep === 3}>
          <LucideIcon name="ArrowLeft" /> Previous
        </button>
        {currentStep < 2 && (
          <button onClick={nextStep} disabled={!canProceed()}>
            Next <LucideIcon name="ArrowRight" />
          </button>
        )}
      </div>
    </div>
  );
};