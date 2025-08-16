Add-Type -AssemblyName PresentationFramework

# Rainbow Window XML with gorgeous gradient backgrounds
$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ArtBastard DMX512 Control Center" Width="950" Height="650"
        WindowStartupLocation="CenterScreen" ResizeMode="CanMinimize">
    <Window.Background>
        <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
            <GradientStop Color="#FF6B73FF" Offset="0"/>
            <GradientStop Color="#FF9DFFB7" Offset="0.2"/>
            <GradientStop Color="#FFFFB7FF" Offset="0.4"/>
            <GradientStop Color="#FFFFC600" Offset="0.6"/>
            <GradientStop Color="#FFFF9500" Offset="0.8"/>
            <GradientStop Color="#FFFF6B6B" Offset="1"/>
        </LinearGradientBrush>
    </Window.Background>
    
    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <!-- Header -->
        <TextBlock Grid.Row="0" Text="ARTBASTARD DMX512 CONTROL CENTER" 
                   FontSize="24" FontWeight="Bold" HorizontalAlignment="Center"
                   Foreground="White" Margin="0,0,0,20">
            <TextBlock.Effect>
                <DropShadowEffect Color="Black" BlurRadius="3" ShadowDepth="2"/>
            </TextBlock.Effect>
        </TextBlock>
        
        <!-- Buttons with rainbow styling -->
        <WrapPanel Grid.Row="1" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,20">
            <Button Name="BtnStatus" Content="STATUS CHECK" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF4CAF50" Offset="0"/>
                        <GradientStop Color="#FF8BC34A" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnKill" Content="KILL PROCESSES" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FFF44336" Offset="0"/>
                        <GradientStop Color="#FFFF5722" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnClean" Content="CLEAN" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF2196F3" Offset="0"/>
                        <GradientStop Color="#FF03DAC6" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnFullClean" Content="FULL CLEAN" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF9C27B0" Offset="0"/>
                        <GradientStop Color="#FFE91E63" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnQuickstart" Content="QUICKSTART" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FFFF9800" Offset="0"/>
                        <GradientStop Color="#FFFFC107" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnRebuild" Content="REBUILD ALL" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF673AB7" Offset="0"/>
                        <GradientStop Color="#FF3F51B5" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnRebuildBackend" Content="REBUILD BACKEND" Width="150" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF607D8B" Offset="0"/>
                        <GradientStop Color="#FF795548" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnDev" Content="DEV MODE" Width="120" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FF009688" Offset="0"/>
                        <GradientStop Color="#FF4CAF50" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
            
            <Button Name="BtnDevWithFrontend" Content="DEV + FRONTEND" Width="150" Height="35" Margin="5">
                <Button.Background>
                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                        <GradientStop Color="#FFCDDC39" Offset="0"/>
                        <GradientStop Color="#FF8BC34A" Offset="1"/>
                    </LinearGradientBrush>
                </Button.Background>
            </Button>
        </WrapPanel>
        
        <!-- Output text box -->
        <ScrollViewer Grid.Row="2" VerticalScrollBarVisibility="Auto" Background="#FF1E1E1E" 
                      BorderBrush="#FF4CAF50" BorderThickness="2">
            <TextBox Name="Output" IsReadOnly="True" TextWrapping="Wrap" 
                     Background="Transparent" Foreground="#FF00FF00" 
                     FontFamily="Consolas" FontSize="11" Margin="5"/>
        </ScrollViewer>
        
        <!-- Status bar -->
        <Border Grid.Row="3" Background="#FF2D2D30" BorderBrush="#FF3E3E42" BorderThickness="1" 
                Margin="0,10,0,0" Height="30">
            <TextBlock Name="StatusText" Text="Ready" Foreground="White" 
                       VerticalAlignment="Center" Margin="10,0"/>
        </Border>
    </Grid>
</Window>
"@

# Create window
$window = [Windows.Markup.XamlReader]::Parse($xaml)

# Get references to controls
$controls = @{}
$controls.Output = $window.FindName('Output')
$controls.StatusText = $window.FindName('StatusText')
$controls.BtnStatus = $window.FindName('BtnStatus')
$controls.BtnKill = $window.FindName('BtnKill')
$controls.BtnClean = $window.FindName('BtnClean')
$controls.BtnFullClean = $window.FindName('BtnFullClean')
$controls.BtnQuickstart = $window.FindName('BtnQuickstart')
$controls.BtnRebuild = $window.FindName('BtnRebuild')
$controls.BtnRebuildBackend = $window.FindName('BtnRebuildBackend')
$controls.BtnDev = $window.FindName('BtnDev')
$controls.BtnDevWithFrontend = $window.FindName('BtnDevWithFrontend')

# Path to UNIFIED-TOOLS.ps1
$script = Join-Path $PSScriptRoot "UNIFIED-TOOLS.ps1"

# Function to execute UNIFIED-TOOLS commands
function Invoke-Tool($argsArray){
    $controls.Output.ScrollToEnd()
    
    $cmd = "& '$script' $($argsArray -join ' ')"
    $controls.Output.AppendText("`nFIRE > $cmd`n")
    $controls.StatusText.Text = "LIGHTNING Running: $($argsArray -join ' ')..."
    
    try {
        # Use Start-Process with output redirection to capture ALL streams
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-NoLogo -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command ""& '$script' $($argsArray -join ' ')"""
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $startInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $startInfo
        
        # Start the process
        $process.Start() | Out-Null
        
        # Read output and error streams
        $output = $process.StandardOutput.ReadToEnd()
        $errorOutput = $process.StandardError.ReadToEnd()
        
        # Wait for process to complete
        $process.WaitForExit()
        $exitCode = $process.ExitCode
        $process.Dispose()
        
        # Display output
        if ($output) {
            $controls.Output.AppendText($output)
        }
        if ($errorOutput) {
            $controls.Output.AppendText("STDERR: $errorOutput`n")
        }
        
        $controls.StatusText.Text = "CHECKMARK Command completed (Exit: $exitCode)"
        $controls.Output.ScrollToEnd()
        
    } catch {
        $controls.Output.AppendText("BOOM EXCEPTION: $($_.Exception.Message)`n")
        $controls.StatusText.Text = "X Exception occurred"
        $controls.Output.ScrollToEnd()
    }
}

# Button click handlers - NO MORE DISAPPEARING BUTTONS!
$controls.BtnStatus.Add_Click({ Invoke-Tool @('status') })
$controls.BtnKill.Add_Click({ Invoke-Tool @('kill') })
$controls.BtnClean.Add_Click({ Invoke-Tool @('clean') })
$controls.BtnFullClean.Add_Click({ Invoke-Tool @('clean', '-Full') })
$controls.BtnQuickstart.Add_Click({ Invoke-Tool @('quickstart') })
$controls.BtnRebuild.Add_Click({ Invoke-Tool @('rebuild') })
$controls.BtnRebuildBackend.Add_Click({ Invoke-Tool @('rebuild', '-BackendOnly') })
$controls.BtnDev.Add_Click({ Invoke-Tool @('dev') })
$controls.BtnDevWithFrontend.Add_Click({ Invoke-Tool @('dev', '-DevFrontend') })

# Welcome message
$controls.Output.AppendText("THEATER Welcome to ArtBastard DMX512 Control Center! SPARKLES`n")
$controls.Output.AppendText("RAINBOW Click any button to execute commands...`n`n")

# Show the window
$window.ShowDialog()
