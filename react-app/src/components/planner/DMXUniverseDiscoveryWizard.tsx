import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useStore } from '../../store'
import useStoreUtils from '../../store/storeUtils'
import { LucideIcon } from '../ui/LucideIcon'
import { v4 as uuidv4 } from 'uuid'
import styles from './DMXUniverseDiscoveryWizard.module.scss'

interface FixtureTemplate {
  id: string
  name: string
  type: string
  manufacturer: string
  model: string
  channels: number
  commonChannels: {
    name: string
    type: string
    description: string
  }[]
}

// Common fixture templates based on typical DMX fixtures
const FIXTURE_TEMPLATES: FixtureTemplate[] = [
  {
    id: 'generic-rgbw-par',
    name: 'Generic RGBW Par Light',
    type: 'par',
    manufacturer: 'Unknown',
    model: 'RGBW-PAR',
    channels: 7,
    commonChannels: [
      { name: 'Dimmer', type: 'dimmer', description: 'Master intensity' },
      { name: 'Red', type: 'red', description: 'Red color channel' },
      { name: 'Green', type: 'green', description: 'Green color channel' },
      { name: 'Blue', type: 'blue', description: 'Blue color channel' },
      { name: 'White', type: 'white', description: 'White color channel' },
      { name: 'Strobe', type: 'strobe', description: 'Strobe/flash effect' },
      { name: 'Mode', type: 'macro', description: 'Color macros/programs' }
    ]
  },
  {
    id: 'generic-moving-head',
    name: 'Generic Moving Head Spot',
    type: 'moving_head',
    manufacturer: 'Unknown',
    model: 'MH-SPOT',
    channels: 12,
    commonChannels: [
      { name: 'Pan', type: 'pan', description: 'Horizontal movement' },
      { name: 'Pan Fine', type: 'pan_fine', description: 'Precise horizontal movement' },
      { name: 'Tilt', type: 'tilt', description: 'Vertical movement' },
      { name: 'Tilt Fine', type: 'tilt_fine', description: 'Precise vertical movement' },
      { name: 'Dimmer', type: 'dimmer', description: 'Master intensity' },
      { name: 'Shutter', type: 'shutter', description: 'Shutter/strobe' },
      { name: 'Color Wheel', type: 'color_wheel', description: 'Color wheel selection' },
      { name: 'Gobo Wheel', type: 'gobo_wheel', description: 'Gobo pattern selection' },
      { name: 'Gobo Rotation', type: 'gobo_rotation', description: 'Gobo rotation speed' },
      { name: 'Prism', type: 'prism', description: 'Prism effect' },
      { name: 'Zoom', type: 'zoom', description: 'Beam zoom' },
      { name: 'Reset', type: 'reset', description: 'Reset/maintenance' }
    ]
  },
  {
    id: 'generic-led-wash',
    name: 'Generic LED Wash Light',
    type: 'wash',
    manufacturer: 'Unknown',
    model: 'LED-WASH',
    channels: 9,
    commonChannels: [
      { name: 'Dimmer', type: 'dimmer', description: 'Master intensity' },
      { name: 'Red', type: 'red', description: 'Red color channel' },
      { name: 'Green', type: 'green', description: 'Green color channel' },
      { name: 'Blue', type: 'blue', description: 'Blue color channel' },
      { name: 'White', type: 'white', description: 'White color channel' },
      { name: 'Amber', type: 'amber', description: 'Amber color channel' },
      { name: 'UV', type: 'uv', description: 'UV color channel' },
      { name: 'Strobe', type: 'strobe', description: 'Strobe/flash effect' },
      { name: 'Macro', type: 'macro', description: 'Color macros/programs' }
    ]
  }
]

interface WizardStep {
  id: string
  title: string
  artsnobTitle: string
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Welcome', artsnobTitle: '🎭 Welcome to Your DMX Journey' },
  { id: 'fixtures', title: 'Fixture Count', artsnobTitle: '🔢 Count Your Luminous Arsenal' },
  { id: 'knowledge', title: 'Your Expertise', artsnobTitle: '🤔 Confess Your Lighting Crimes' },
  { id: 'discovery', title: 'Universe Discovery', artsnobTitle: '🌌 Discover Your Universe' },
  { id: 'assignment', title: 'Address Assignment', artsnobTitle: '📍 Address Assignment Ceremony' },
  { id: 'complete', title: 'Complete', artsnobTitle: '🎊 Welcome to DMX Mastery!' }
]

export const DMXUniverseDiscoveryWizard: React.FC = () => {
  const { theme } = useTheme()
  const { fixtures } = useStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [fixtureCount, setFixtureCount] = useState(12)
  const [userExperience, setUserExperience] = useState<'beginner' | 'intermediate' | 'expert'>('beginner')
  const [discoveryMethod, setDiscoveryMethod] = useState<'auto' | 'manual'>('auto')
  const [selectedTemplate, setSelectedTemplate] = useState<FixtureTemplate | null>(null)
  const [generatedFixtures, setGeneratedFixtures] = useState<any[]>([])
  const [startAddress, setStartAddress] = useState(1)

  const currentStepData = WIZARD_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateFixtures = () => {
    if (!selectedTemplate) return

    const fixtures = []
    let currentAddress = startAddress

    for (let i = 0; i < fixtureCount; i++) {
      const fixture = {
        id: uuidv4(),
        name: `${selectedTemplate.name} ${i + 1}`,
        type: selectedTemplate.type,
        manufacturer: selectedTemplate.manufacturer,
        model: selectedTemplate.model,
        startAddress: currentAddress,
        channels: selectedTemplate.commonChannels.map(ch => ({
          name: ch.name,
          type: ch.type,
          dmxAddress: undefined // Let the system auto-calculate
        })),
        notes: `Auto-generated fixture ${i + 1} of ${fixtureCount}. ${selectedTemplate.commonChannels.length} channels starting at DMX address ${currentAddress}.`
      }
      fixtures.push(fixture)
      currentAddress += selectedTemplate.channels
    }

    setGeneratedFixtures(fixtures)
  }

  const applyFixturesToSystem = () => {
    useStoreUtils.setState(state => ({
      fixtures: [...state.fixtures, ...generatedFixtures]
    }))
    useStoreUtils.getState().addNotification({
      message: `Successfully added ${generatedFixtures.length} fixtures to the system!`,
      type: 'success',
      priority: 'normal'
    })
  }

  useEffect(() => {
    if (currentStep === 4 && selectedTemplate) { // Address assignment step
      generateFixtures()
    }
  }, [currentStep, selectedTemplate, fixtureCount, startAddress])

  const renderWelcomeStep = () => (
    <div className={styles.stepContent}>
      <div className={styles.welcomeHeader}>
        {theme === 'artsnob' ? (
          <>
            <h3>🎭 Greetings, Future DMX Maestro!</h3>
            <p>So, you've acquired some mysterious Chinese lighting fixtures with documentation written in what appears to be ancient hieroglyphics? Fear not! You've come to the right place.</p>
            <p>This wizard will guide you through the sacred art of DMX universe discovery, transforming your collection of enigmatic light boxes into a symphony of controllable brilliance.</p>
            <div className={styles.encouragementBox}>
              <LucideIcon name="Lightbulb" />
              <p><strong>Remember:</strong> Every lighting professional started exactly where you are now - staring at unmarked fixtures wondering "What does channel 7 do?"</p>
            </div>
          </>
        ) : (
          <>
            <h3>DMX Universe Setup Wizard</h3>
            <p>This wizard will help you set up your DMX fixtures and discover your universe configuration.</p>
            <p>Whether you're a beginner or experienced user, we'll guide you through the process of configuring your lighting setup.</p>
          </>
        )}
      </div>
    </div>
  )

  const renderFixtureCountStep = () => (
    <div className={styles.stepContent}>
      <h3>
        {theme === 'artsnob' ? '🔢 How Many Luminous Devices Did You Acquire?' : 'How Many Fixtures Do You Have?'}
      </h3>
      <p>
        {theme === 'artsnob' 
          ? 'Count them all - every last LED panel, moving head, and mysterious cylinder that may or may not be a fog machine.'
          : 'Enter the total number of DMX fixtures you need to configure.'
        }
      </p>
      
      <div className={styles.inputGroup}>
        <label>Number of Fixtures:</label>
        <input
          type="number"
          min="1"
          max="50"
          value={fixtureCount}
          onChange={(e) => setFixtureCount(parseInt(e.target.value) || 1)}
          className={styles.numberInput}
        />
      </div>

      {theme === 'artsnob' && (
        <div className={styles.sassyComment}>
          <p>{fixtureCount > 20 ? '🤯 Ambitious! Someone is building a festival rig!' : 
             fixtureCount > 10 ? '👍 Nice collection! You mean business.' :
             '🎯 Perfect starter setup! Quality over quantity, we respect that.'}</p>
        </div>
      )}
    </div>
  )

  const renderKnowledgeStep = () => (
    <div className={styles.stepContent}>
      <h3>
        {theme === 'artsnob' ? '🤔 Confess: How Much Do You Actually Know?' : 'What\'s Your Experience Level?'}
      </h3>
      <p>
        {theme === 'artsnob'
          ? 'Be honest - this is a judgment-free zone. We have all been there, pretending we know what "16-bit pan resolution" means.'
          : 'This helps us customize the wizard to your experience level.'
        }
      </p>

      <div className={styles.optionGroup}>
        {[
          { 
            value: 'beginner', 
            label: 'Beginner', 
            artsnobLabel: '🆕 "DMX? I thought that was a rapper"',
            description: theme === 'artsnob' ? 'You bought lights, they came with cables, now what?' : 'New to DMX lighting control'
          },
          { 
            value: 'intermediate', 
            artsnobLabel: '🤓 "I know some stuff but Google is my friend"',
            label: 'Intermediate',
            description: theme === 'artsnob' ? 'You can set addresses but still guess at channel functions' : 'Some experience with DMX systems'
          },
          { 
            value: 'expert', 
            label: 'Expert',
            artsnobLabel: '🧙‍♂️ "I speak fluent DMX-512 and dream in hexadecimal"',
            description: theme === 'artsnob' ? 'You probably do not need this wizard but you are here for fun' : 'Experienced with DMX protocols and addressing'
          }
        ].map((option) => (
          <button
            key={option.value}
            className={`${styles.optionButton} ${userExperience === option.value ? styles.selected : ''}`}
            onClick={() => setUserExperience(option.value as any)}
          >
            <div className={styles.optionTitle}>
              {theme === 'artsnob' ? option.artsnobLabel : option.label}
            </div>
            <div className={styles.optionDescription}>
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderDiscoveryStep = () => (
    <div className={styles.stepContent}>
      <h3>
        {theme === 'artsnob' ? '🌌 Choose Your Discovery Adventure' : 'Discovery Method'}
      </h3>
      <p>
        {theme === 'artsnob'
          ? 'How shall we approach this archaeological expedition into your fixture specifications?'
          : 'How would you like to configure your fixtures?'
        }
      </p>

      <div className={styles.discoveryOptions}>
        <button
          className={`${styles.discoveryOption} ${discoveryMethod === 'auto' ? styles.selected : ''}`}
          onClick={() => setDiscoveryMethod('auto')}
        >
          <LucideIcon name="Zap" />
          <div className={styles.optionContent}>
            <h4>{theme === 'artsnob' ? '⚡ Auto-Discovery Magic' : 'Automatic Setup'}</h4>
            <p>
              {theme === 'artsnob' 
                ? 'Let us guess what your mysterious fixtures do based on common patterns. Perfect for when the manual is in a language you do not recognize.'
                : 'Use common fixture templates and automatic address assignment.'
              }
            </p>
          </div>
        </button>

        <button
          className={`${styles.discoveryOption} ${discoveryMethod === 'manual' ? styles.selected : ''}`}
          onClick={() => setDiscoveryMethod('manual')}
        >
          <LucideIcon name="Settings" />
          <div className={styles.optionContent}>
            <h4>{theme === 'artsnob' ? '🛠️ Manual Configuration' : 'Manual Setup'}</h4>
            <p>
              {theme === 'artsnob'
                ? 'For those brave souls who actually read manuals and know exactly what channel 42 controls.'
                : 'Manually configure each fixture with custom channel assignments.'
              }
            </p>
          </div>
        </button>
      </div>

      {discoveryMethod === 'auto' && (
        <div className={styles.templateSelection}>
          <h4>Choose a Template:</h4>
          <div className={styles.templateGrid}>
            {FIXTURE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className={`${styles.templateCard} ${selectedTemplate?.id === template.id ? styles.selected : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h5>{template.name}</h5>
                <p>{template.channels} channels</p>
                <div className={styles.channelList}>
                  {template.commonChannels.slice(0, 4).map((ch, idx) => (
                    <span key={idx} className={styles.channelTag}>{ch.name}</span>
                  ))}
                  {template.commonChannels.length > 4 && <span className={styles.channelTag}>+{template.commonChannels.length - 4}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderAssignmentStep = () => (
    <div className={styles.stepContent}>
      <h3>
        {theme === 'artsnob' ? '📍 The Great Address Assignment Ceremony' : 'DMX Address Assignment'}
      </h3>
      <p>
        {theme === 'artsnob'
          ? 'Behold! We shall now assign each fixture its sacred DMX address in the great universe of 512 channels.'
          : 'Configure the starting DMX address for your fixture sequence.'
        }
      </p>

      <div className={styles.addressConfig}>
        <div className={styles.inputGroup}>
          <label>Starting DMX Address:</label>
          <input
            type="number"
            min="1"
            max="500"
            value={startAddress}
            onChange={(e) => setStartAddress(parseInt(e.target.value) || 1)}
            className={styles.numberInput}
          />
        </div>

        {selectedTemplate && (
          <div className={styles.fixturePreview}>
            <h4>Fixture Layout Preview:</h4>
            <div className={styles.previewList}>
              {Array.from({ length: Math.min(fixtureCount, 10) }).map((_, idx) => {
                const address = startAddress + (idx * selectedTemplate.channels)
                return (
                  <div key={idx} className={styles.previewFixture}>
                    <span className={styles.fixtureName}>{selectedTemplate.name} {idx + 1}</span>
                    <span className={styles.fixtureAddress}>
                      DMX {address}-{address + selectedTemplate.channels - 1}
                    </span>
                  </div>
                )
              })}
              {fixtureCount > 10 && (
                <div className={styles.previewFixture}>
                  <span className={styles.fixtureName}>... and {fixtureCount - 10} more fixtures</span>
                </div>
              )}
            </div>

            <div className={styles.summaryBox}>
              <LucideIcon name="Info" />
              <div>
                <strong>Universe Summary:</strong>
                <br />Total fixtures: {fixtureCount}
                <br />Channels per fixture: {selectedTemplate.channels}
                <br />Total channels needed: {fixtureCount * selectedTemplate.channels}
                <br />Final address: {startAddress + (fixtureCount * selectedTemplate.channels) - 1}
                {(startAddress + (fixtureCount * selectedTemplate.channels) - 1) > 512 && (
                  <span className={styles.warning}>
                    <br />⚠️ Warning: Exceeds DMX universe limit (512 channels)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className={styles.stepContent}>
      <div className={styles.completionHeader}>
        <h3>
          {theme === 'artsnob' ? '🎊 Congratulations, DMX Apprentice!' : 'Setup Complete!'}
        </h3>
        <p>
          {theme === 'artsnob'
            ? 'You have successfully transformed from a bewildered fixture owner into a DMX universe architect! Your lighting journey begins now.'
            : 'Your DMX universe has been configured. You can now control your fixtures through the ArtBastard system.'
          }
        </p>

        <div className={styles.completionSummary}>
          <div className={styles.summaryItem}>
            <LucideIcon name="Lightbulb" />
            <span>{fixtureCount} fixtures configured</span>
          </div>
          <div className={styles.summaryItem}>
            <LucideIcon name="MapPin" />
            <span>Starting at address {startAddress}</span>
          </div>
          <div className={styles.summaryItem}>
            <LucideIcon name="Zap" />
            <span>{selectedTemplate ? selectedTemplate.channels * fixtureCount : 0} total channels</span>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            onClick={applyFixturesToSystem}
            className={styles.primaryButton}
          >
            <LucideIcon name="Plus" />
            Add Fixtures to System
          </button>
          
          <button
            onClick={() => setCurrentStep(0)}
            className={styles.secondaryButton}
          >
            <LucideIcon name="RotateCcw" />
            Start Over
          </button>
        </div>

        {theme === 'artsnob' && (
          <div className={styles.finalWisdom}>
            <p>
              "Remember, young lighting warrior: With great lumens comes great responsibility. 
              Use your newfound DMX powers wisely, and may your gobos always rotate smoothly."
            </p>
            <p className={styles.signature}>
              — The ArtBastard DMX Collective
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep()
      case 1: return renderFixtureCountStep()
      case 2: return renderKnowledgeStep()
      case 3: return renderDiscoveryStep()
      case 4: return renderAssignmentStep()
      case 5: return renderCompleteStep()
      default: return renderWelcomeStep()
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return fixtureCount > 0
      case 2: return userExperience !== null
      case 3: return discoveryMethod === 'manual' || selectedTemplate !== null
      case 4: return selectedTemplate !== null && startAddress > 0
      case 5: return true
      default: return false
    }
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardHeader}>
        <div className={styles.stepIndicator}>
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.stepDot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
            >
              {index < currentStep ? <LucideIcon name="Check" /> : index + 1}
            </div>
          ))}
        </div>
        <h2>{theme === 'artsnob' ? currentStepData.artsnobTitle : currentStepData.title}</h2>
      </div>

      <div className={styles.wizardContent}>
        {renderCurrentStep()}
      </div>

      <div className={styles.wizardFooter}>
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className={styles.backButton}
        >
          <LucideIcon name="ChevronLeft" />
          Back
        </button>

        <div className={styles.stepInfo}>
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>

        {!isLastStep ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={styles.nextButton}
          >
            Next
            <LucideIcon name="ChevronRight" />
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'fixture' } }))}
            className={styles.finishButton}
          >
            Go to Fixture Control
            <LucideIcon name="ExternalLink" />
          </button>
        )}
      </div>
    </div>
  )
}