using CommunityToolkit.Maui.Views;

namespace AudioGo_Mobile.Views;

public partial class CustomAlertPopup : Popup
{
    public CustomAlertPopup(string title, string message, string buttonText)
    {
        InitializeComponent();
        
        TitleLabel.Text = title;
        MessageLabel.Text = message;
        ActionButton.Text = buttonText;
    }

    private void OnActionClicked(object sender, EventArgs e)
    {
        Close(true);
    }
}
