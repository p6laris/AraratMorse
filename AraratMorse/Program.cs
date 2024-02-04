using AraratMorse.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ClipLazor.Extention;

using Fluxor;
using FluentValidation;
using AraratMorse.Models;
using Howler.Blazor.Components;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddFluxor(o =>
{
    o.ScanAssemblies(typeof(Program).Assembly);
#if DEBUG
    o.UseReduxDevTools();
#endif
});

builder.Services.AddClipboard();
builder.Services.AddTransient<IValidator<Settings>, SettingsValidator>();

builder.Services.AddScoped<IHowl, Howl>();
builder.Services.AddScoped<IHowlGlobal, HowlGlobal>();

await builder.Build().RunAsync();
