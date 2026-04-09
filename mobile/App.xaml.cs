namespace AudioGo_Mobile;

using AudioGo_Mobile.Views;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		return new Window(new NavigationPage(new WelcomePage()));
	}
}