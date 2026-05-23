using AudioGo.ViewModels;

namespace AudioGo_Mobile.Views;

public partial class ArticleListPage : ContentPage
{
    private readonly ArticleListViewModel _vm;

    public ArticleListPage(ArticleListViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadArticlesAsync();
    }
}
