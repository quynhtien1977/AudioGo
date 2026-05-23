using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class ArticleDetailPage : ContentPage
{
    private readonly ArticleDetailViewModel _vm;

    public ArticleDetailPage(ArticleDetailViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }
}
