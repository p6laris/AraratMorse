using AraratMorse.Components;
using AraratMorse.Models;
using AraratMorse.State;
using ClipLazor.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddSingleton<MorseService>();
builder.Services.AddSingleton<AppState>();
builder.Services.AddSingleton<MorseSettings>();
builder.Services.AddSingleton<KochStats>();
builder.Services.AddClipboard();
builder.Services.AddTransient<IValidator<Settings>, SettingsValidator>();

await builder.Build().RunAsync();
